# MapProxyAdmin
Web administrator for mapproxy configurations

[MapProxy](https://mapproxy.org/) is an open source proxy and caching service for WMS, WMTS, TMS and other geospatial data services.

The MapProxy configuration is defined in yaml files. This project, MapProxyAdmin, provides a Web-UI for some common use cases:
* create a new configuration from scratch, based on WMS capabilities
* list the available MapProxy configurations and layers within configurations
* clear the cache for a given layer
* delete configurations

## Install

### Prerequisites
* mapproxy, configured as [MultiMapProxy](https://mapproxy.org/docs/1.11.0/deployment.html#multimapproxy)
* git
* unzip
* node and npm

It is assumed that the MapProxy configuration directories is structured below a single configuration root directory:
/path/to/your/mapproxy/config. The directories for the caches and the MultiMapProxy 
configurations are assumed to be subdirectories of this root directory.

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
    ***mapproxy_projects*** defines the name of the subdirectory for the MultiMapProxy configuration,  
    ***mapproxy_cache*** defines the subdirectory that is the root directory for the caches.
3. unzip public/dist.zip, the resulting files and folders should go to public/
4. install dependencies for MapProxyAdmin (index.js)

        npm install

5. start the MapProxyAdmin service

        node index.js

6. open http://host.example.com:8083 in your browser

## Develop
The MapProxyAdmin source code for both client and server are JavaScript. The server uses Node and some node modules (Express, WMSCapabilities and JSYaml to name some), the client is based on WebComponents using [Polymer](https://www.polymer-project.org/) LitElement and LitHtml. Client development requires installation of polymer-cli


### Server dev
The server code is in index.js. Use a debugger to set breakpoints and step through the code. 

1. start node in debug mode:

        node --inpect index.js

2. To open the debugger in the (Chrome) browser, type

        chrome://inspect
    
    in the address bar. Set breakpoints to step through the code

### Client dev
The source code for the browser client resides in directory /client. The code is built using polymer-cli and the build output is copied to the /public directory where it can run indepently of polymer. During development, client and server are separated. The server runs under node (see Server development above), the client runs under polymer, listening on a different port.

### Run client for dev under polymer
1. copy public/confg.json to client/config.json, edit client/config.json and set "adminserver" to http://localhost:8083
2. install polymer-cli

        npm install -g polymer-cli

3. install client dependencies, run the following command in the client directory:

        npm install

4. start the client under polymer 

        polymer serve

5. point your browser to http://localhost:8081 (the client runs on port 8081, the server on port 8083)

### Build client for integration into server
Run the following commands in the /client directory:

      polymer build
      cd build/default
      zip -r dist.zip
      cp dist.zip ../public














