Testing ingress in Minikube requires several steps to properly configure and verify DNS resolution.1 You'll need to set up an application, create an ingress resource, and then modify your host machine's hosts file to simulate DNS.2




1. Start Minikube and Deploy an Application

First, ensure Minikube is running.3 You can start it with the following command:


Bash



minikube start
Next, deploy a sample application. For this example, let's use a simple NGINX deployment. Save the following YAML as deployment.yaml:
YAML



apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80
Apply this deployment:
Bash



kubectl apply -f deployment.yaml
Now, expose the deployment with a service. Save the following as service.yaml:
YAML



apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
Apply the service:
Bash



kubectl apply -f service.yaml


2. Enable Ingress and Create the Ingress Resource

Minikube's ingress controller is a built-in add-on, but it's not enabled by default. You need to enable it before you can create an ingress resource.
Enable the ingress add-on:
Bash



minikube addons enable ingress
Now, create the ingress resource. Save the following as ingress.yaml. This resource will route traffic from my-nginx-app.info to your nginx-service.
YAML



apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-ingress
spec:
  rules:
  - host: my-nginx-app.info
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx-service
            port:
              number: 80
Apply the ingress resource:
Bash



kubectl apply -f ingress.yaml


3. Modify Your Hosts File and Test

The final step is to tell your local machine how to resolve the custom DNS name my-nginx-app.info. Since Minikube runs inside a virtual machine, you can't use a regular DNS server. Instead, you'll need to modify your computer's hosts file to map the domain name to Minikube's IP address.4


First, get Minikube's IP address:
Bash



minikube ip
The output will be an IP address like 192.168.49.2.
Now, open your hosts file with administrator/sudo privileges. The location of this file depends on your operating system:
* Linux/macOS: /etc/hosts
* Windows: C:\Windows\System32\drivers\etc\hosts
Add the following line to the end of the file, replacing the IP address with the one you obtained from minikube ip:
<minikube-ip> my-nginx-app.info
For example:
192.168.49.2 my-nginx-app.info
Save the file. Your system will now resolve my-nginx-app.info to your Minikube VM.
To verify that it works, open a web browser or use curl to access the domain:
Bash



curl my-nginx-app.info
You should see the default NGINX welcome page as the response, confirming that the ingress is correctly routing traffic to your application.


Testing an Envoy implementation of the Gateway API in Minikube involves a multi-step process: you need to set up a Minikube cluster, install the Envoy Gateway controller, deploy your application, and then create the Gateway API resources to route traffic.1 Finally, you'll use minikube tunnel or port-forwarding to access and test your application.2




1. Start Minikube and Install Envoy Gateway

First, start a Minikube cluster.3 It's best to allocate a decent amount of resources to it.


Bash



minikube start --cpus=2 --memory=4096
Next, you need to install the Envoy Gateway controller and the Gateway API CRDs (Custom Resource Definitions). The simplest way to do this is with Helm.
Bash



helm install eg oci://docker.io/envoyproxy/gateway-helm --version v1.4.1 -n envoy-gateway-system --create-namespace
Wait for the Envoy Gateway deployment to become available:
Bash




kubectl wait --timeout=5m -n envoy-gateway-system deployment/envoy-gateway --for=condition=Available


2. Deploy an Example Application and Gateway API Resources

Now, let's deploy a simple test application and the corresponding Gateway API resources to expose it. This is a crucial step to test the functionality.
First, deploy a sample application, like a simple echo-server, and its associated service. Save the following YAML as app.yaml:
YAML



apiVersion: v1
kind: Service
metadata:
  name: echo-server
spec:
  selector:
    app: echo-server
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: echo-server
  template:
    metadata:
      labels:
        app: echo-server
    spec:
      containers:
        - name: echo-server
          image: hashicorp/http-echo
          args:
            - "-text=Hello, Minikube from the Gateway API!"
          ports:
            - containerPort: 8080
Apply the application:
Bash



kubectl apply -f app.yaml
Next, create the Gateway API resources. This will include a GatewayClass, a Gateway, and an HTTPRoute. The GatewayClass is the blueprint, the Gateway is the entry point, and the HTTPRoute defines the routing rules. Save the following as gateway.yaml:
YAML



apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: eg
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: my-gateway
spec:
  gatewayClassName: eg
  listeners:
    - name: http
      protocol: HTTP
      port: 80
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: echo-server-route
spec:
  parentRefs:
    - name: my-gateway
  hostnames:
    - "echo.example.com"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: "/"
      backendRefs:
        - name: echo-server
          port: 80
Apply the Gateway API resources:
Bash



kubectl apply -f gateway.yaml


3. Expose and Test the Gateway

Because Minikube runs a VM and the Envoy Gateway is exposed as a LoadBalancer service, you need a way to expose it on your local machine.

Option A: Using minikube tunnel (Recommended)

The easiest method is to use minikube tunnel, which creates a network route from your machine to the Minikube cluster's services. It will run in the foreground, so you'll need to open a new terminal.
Open a new terminal and run:
Bash



minikube tunnel
Wait until the tunnel is established. It will provide the IP address for the load balancer. Note this IP address.

Option B: Using kubectl port-forward

If you prefer not to use a separate terminal for the tunnel, you can port-forward the Envoy Gateway service.
First, get the name of the Envoy service:
Bash



export ENVOY_SERVICE=$(kubectl get svc -n envoy-gateway-system --selector=gateway.envoyproxy.io/owning-gateway-namespace=default,gateway.envoyproxy.io/owning-gateway-name=my-gateway -o jsonpath='{.items[0].metadata.name}')
Then, port-forward the service. This will also block your terminal.
Bash



kubectl -n envoy-gateway-system port-forward service/${ENVOY_SERVICE} 8080:80


4. Test the Route with a Custom DNS

To test the HTTPRoute with its custom hostname (echo.example.com), you need to tell your local machine how to resolve this domain.
Using minikube tunnel
: Get the load balancer IP from the minikube tunnel output.
Using kubectl port-forward
: The IP address is 127.0.0.1 and the port is 8080.
Modify your system's hosts file to map echo.example.com to the correct IP address.
* Linux/macOS: /etc/hosts
* Windows: C:\Windows\System32\drivers\etc\hosts
Add the following line, replacing <load-balancer-ip> with the IP from minikube tunnel:
<load-balancer-ip> echo.example.com
If you used port-forwarding, the line will be:
127.0.0.1 echo.example.com
Save the file.
Now, you can test the entire chain from your local machine to the application within Minikube.
Bash



curl http://echo.example.com
If everything is configured correctly, the command will return the message from the echo-server application: "Hello, Minikube from the Gateway API!". This confirms that Envoy Gateway has correctly implemented the Gateway API rules and is routing traffic as expected.