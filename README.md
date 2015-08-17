# turf-builder
A simple user interface for generating custom browserify builds of Turf.js

This simple UI enables users to generate custom browserify builds of Turf.js without the commandline.

###Installation
Download the code and place it in a folder called 'Build' in folder containing a copy of the Turf repo. Once you've done that run the following in your command line from the build directory 
````
npm install
````

###Starting the application
In the command line type 
````
node index.js
````
This should automatically open up a new browser window with the application, if not try navigating to (http://localhost:5000)[http://localhost:5000]

###Use
Simply check the boxes on the interface and hit 'Build', this will generate a new file and place it in the 'Output' directory.