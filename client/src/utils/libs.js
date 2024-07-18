let EventEmitter2;
(function() {
  const script = document.createElement('script');
  script.src = './src/utils/libs/public/eventemitter2.min.js';
  script.onload = function() {
    EventEmitter2 = window.EventEmitter2;
  };
  document.head.appendChild(script);
})();

// Load the easeljs.min.js library
let createjs;
(function() {
  const script = document.createElement('script');
  script.src = './src/utils/libs/public/easeljs.min.js';
  script.onload = function() {
    createjs = window.createjs;
  };
  document.head.appendChild(script);
})();

// Load the roslib.min.js library
let ROSLIB;
(function() {
  const script = document.createElement('script');
  script.src = '../src/utils/libs/public/roslib.min.js';
  script.onload = function() {
    ROSLIB = window.ROSLIB;
  };
  document.head.appendChild(script);
})();

// Load the ros2d.js library
let ROS2D;
(function() {
  const script = document.createElement('script');
  script.src = './src/utils/libs/public/ros2d.min.js';
  script.type="module";
  script.onload = function() {
    ROS2D = window.ROS2D;
  };
  document.head.appendChild(script);
})();

let MJPEGCANVAS;
(function() {
  const script = document.createElement('script');
  script.src = '../src/utils/mjpegcanvas.min.js';
  script.onload = function() {
    MJPEGCANVAS = window.MJPEGCANVAS;
  };
  document.head.appendChild(script);
})();

let THREE;
(function() {
  const script = document.createElement('script');
  script.src = '../src/utils/libs/three.min.js';
  script.onload = function() {
    THREE = window.THREE;
  };
  document.head.appendChild(script);
})();
/*
let ColladaLoader;
(function() {
  const script = document.createElement('script');
  script.src = '../src/utils/libs/ColladaLoader.js';
  script.onload = function() {
    ColladaLoader = window.ColladaLoader;
  };
  document.head.appendChild(script);
})();

let ColladaLoader2;
(function() {
  const script = document.createElement('script');
  script.src = '../src/utils/libs/ColladaLoader2.js';
  script.onload = function() {
    ColladaLoader2 = window.ColladaLoader2;
  };
  document.head.appendChild(script);
})();

let STLLoader;
(function() {
  const script = document.createElement('script');
  script.src = '../src/utils/libs/STLLoader.js';
  script.onload = function() {
    STLLoader = window.STLLoader;
  };
  document.head.appendChild(script);
})();
*/
let ROS3D;
(function() {
  const script = document.createElement('script');
  script.src = './src/utils/libs/ros3d.min.js';
  script.onload = function() {
    ROS3D = window.ROS3D;
  };
  document.head.appendChild(script);
})();

export {
  EventEmitter2,
  createjs,
  ROSLIB,
  ROS2D,
  MJPEGCANVAS,
  THREE,
  ROS3D
};