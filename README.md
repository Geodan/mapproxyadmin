# mapproxyadmin
Web administrator for mapproxy configurations

[MapProxy](https://mapproxy.org/) is an open source proxy and caching service for WMS, WMTS, TMS and other geospatial data services.

The MapProxy configuration is defined in yaml files. This project, mapproxyadmin, provides a Web-UI for some common use cases:
* create a new configuration based on WMS capabilities
* list the available MapProxy configurations and layers within configurations
* clear the cache for a given layer
* delete configurations

## Install

### Prerequisites
* mapproxy
* git
* unzip
* node 

### Steps
1. Get a copy of this repository

        git clone https://github.com/this/repo

2. copy public/config.json.example to public/config.json and edit the following settings to match your system configuration:

        "adminserver" : "http://host.example.com:8083/",
        "mapproxydir" : "/path/to/root/of/mapproxy",
        "mapproxy_projects": "projects",
        "mapproxy_cache": "mp"

    ***adminserver*** should point to the URL of the mapproxyadmin service, port 8083 is the default port,    
    ***mapproxydir*** should point to the root of your mapproxy configuration directory,  
    ***mapproxy_projects*** defines the name of the subdirectory for the [MultiMapProxy](https://mapproxy.org/docs/1.11.0/deployment.html#multimapproxy) configuration,  
    ***mapproxy_cache*** defines the subdirectory that is the root directory for the caches.
3. unzip public/dist.zip, the resulting files and folders should go to public/
4. install dependencies for the adminserver

        npm install

5. start the MapProxyAdmin service

        node index.js

6. open http://host.example.com:8083 in your browser










