FROM --platform=linux/amd64 ubuntu:20.04

LABEL maintainer="ramsevakmishra69@gmail.com"

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    tar \
    gzip \
    unzip \
    net-tools \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Install XAMPP
RUN apt-get update && apt-get install -y wget libncurses5 libnss3 libx11-6 \
    && wget https://downloads.sourceforge.net/project/xampp/XAMPP%20Linux/8.2.12/xampp-linux-x64-8.2.12-0-installer.run -O /tmp/xampp-installer.run \
    && chmod +x /tmp/xampp-installer.run \
    && /tmp/xampp-installer.run --mode unattended \
    && rm /tmp/xampp-installer.run

# Configure Apache to allow external access to XAMPP apps
RUN sed -i 's/Require local/Require all granted/g' /opt/lampp/etc/extra/httpd-xampp.conf

# Download and setup WordPress
RUN wget https://wordpress.org/latest.zip -O /tmp/wordpress.zip \
    && unzip /tmp/wordpress.zip -d /tmp \
    && rm -f /opt/lampp/htdocs/index.php \
    && mv /tmp/wordpress/* /opt/lampp/htdocs/ \
    && rm -rf /tmp/wordpress /tmp/wordpress.zip \
    && chown -R daemon:daemon /opt/lampp/htdocs

# Copy wp-config.php (optional)
COPY wp-config.php /opt/lampp/htdocs/wp-config.php

# Expose ports
EXPOSE 80 443

# Start Apache + MySQL
CMD ["/bin/bash", "-c", "/opt/lampp/lampp start && tail -f /dev/null"]
