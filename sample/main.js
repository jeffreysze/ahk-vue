var app = new Vue({
  el: '#app',
  // storing the state of the page
  data: {
    connected: false,
    ros: null,
    logs: [],
    loading: false,
    rosbridge_address: 'ws://localhost:9090',
    port: '9090',
    dragging: false,
    navigating: false,
    x: 'no',
    y: 'no',
    dragCircleStyle: {
      margin: '0px',
      top: '0px',
      left: '0px',
      display: 'none',
      width: '75px',
      height: '75px',
    },
    // joystick valules
    joystick: {
      vertical: 0,
      horizontal: 0,
    },
    goal: null,
    action: {
      goal: {
        target_pose: {
          header: {
            seq: 0,
            stamp: { secs: 0, nsecs: 0 },
            frame_id: 'map'
          },
          pose: {
            position: { x: 0, y: 0, z: 0 },
            orientation: { x: 0, y: 0, z: 0, w: 0 }
          }
        }
      },
      feedback: {
        base_position: {
          header: { seq: 0, stamp: 0, frame_id: '/map' },
          pose: {
            position: { x: 0, y: 0, z: 0 },
            orientation: { x: 0, y: 0, z: 0, w: 0 }
          }
        }
      },
      result: { success: false },
      status: { status: 0, text: '' },
    },
    //publisher
    pubInterval: null,
    mapViewer: null,
    mapGridClient: null,
    interval: null,
  },
  // helper methods to connect to ROS
  methods: {
    connect: function () {
      this.loading = true
      this.ros = new ROSLIB.Ros({
        url: this.rosbridge_address
      })
      this.ros.on('connection', () => {
        this.logs.unshift((new Date()).toTimeString() + ' - Connected!')
        this.connected = true
        console.log('Connection to ROSBridge established!')
        this.setCamera()
        this.loading = false
        this.pubInterval = setInterval(this.publish, 100);
        this.setup3DViewer()
      })
      this.ros.on('error', (error) => {
        console.log('Something went wrong when trying to connect')
        this.logs.unshift((new Date()).toTimeString() + ` - Error: ${error}`)
      })
      this.ros.on('close', () => {
        this.logs.unshift((new Date()).toTimeString() + ' - Disconnected!')
        this.connected = false
        this.loading = false
        console.log('Connection to ROSBridge was closed!')
        this.unsetCamera()
        this.unset3DViewer()
        clearInterval(this.pubInterval)
      })
    },
    publish: function () {
      let topic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist'
      })
      let message = new ROSLIB.Message({
        linear: { x: this.joystick.vertical, y: 0, z: 0, },
        angular: { x: 0, y: 0, z: this.joystick.horizontal, },
      })
      if (!this.navigating) {
        topic.publish(message)
      }
    },
    disconnect: function () {
      this.ros.close()
    },
    setCamera: function () {
      let without_ws = this.rosbridge_address.split('ws://')[1]
      console.log(without_ws)
      let domain = without_ws.split('/')[0].split(':')[0] + ':8080'
      console.log(domain)
      let host = domain // + '/cameras'
      let viewer = new MJPEGCANVAS.Viewer({
        divID: 'divCamera',
        host: host,
        width: 320,
        height: 240,
        topic: '/camera/color/image_raw',
        ssl: false,
      })
    },
    unsetCamera: function () {
      document.getElementById('divCamera').innerHTML = ''
    },
    setup3DViewer: function () {
      this.viewer = new ROS3D.Viewer({
        background: '#cccccc',
        divID: 'visualization-canvas',
        width: 800,
        height: 600,
        antialias: true,
      })
      this.viewer.renderer.domElement.addEventListener('click', this.mouseClickHandler)
      this.viewer.cameraControls.userRotateSpeed = 0
      this.viewer.cameraControls.autoRotate = false
      this.viewer.cameraControls.autoRotateSpeed = 0
      this.viewer.camera.position.x = 0;
      this.viewer.camera.position.y = 0;
      this.viewer.camera.position.z = 20;
      //            this.viewer.camera.position.set(tf.translation.x, tf.translation.y, 20)
      this.viewer.camera.up = new THREE.Vector3(0, 0, -1)
      this.viewer.camera.lookAt(0, 0, 0)

      this.viewer.camera.updateProjectionMatrix()

      this.viewer.cameraControls.update()
      this.viewer.camera.updateMatrixWorld()
      console.log(this.viewer.cameraControls)

      this.tfClient = new ROSLIB.TFClient({
        ros: this.ros,
        fixedFrame: '/map',
        angularThres: 0.01,
        transThres: 0.01,
        rate: 3.0
      })

      this.mapClient = new ROS3D.OccupancyGridClient({
        ros: this.ros,
        rootObject: this.viewer.scene,
        topic: '/map',
        tfClient: this.tfClient,
        continuous: 'true'
      })
      this.tfClient.subscribe('/base_link', this.subsTF);

      this.laserScanClient = new ROS3D.LaserScan({
        ros: this.ros,
        rootObject: this.viewer.scene,
        topic: '/scan',
        tfClient: this.tfClient,
        material: { size: 0.2, color: 0x00FF00 }
      })
      // Add a grid.
      this.viewer.addObject(new ROS3D.Grid({
        color: '#0181c4',
        cellSize: 1.0,
        num_cells: 20,
      }))

      // Track robot pose with an arrow
      this.arrowNode = new ROS3D.SceneNode({
        tfClient: this.tfClient,
        frameID: '/base_link',
        object: new ROS3D.Arrow({
          length: 1, shaftDiameter: 0.2, headDiameter: 0.5, headLength: 0.8,
          material: new ROS3D.makeColorMaterial(1, 0, 0, 0.5)
        }),
      });

      this.viewer.scene.add(this.arrowNode);


      /*            // Setup the URDF client.
                  this.urdfClient = new ROS3D.UrdfClient({
                      ros: this.ros,
                      param: 'robot_description',
                      tfClient: this.tfClient,
                      // We use "path: location.origin + location.pathname"
                      // instead of "path: window.location.href" to remove query params,
                      // otherwise the assets fail to load
                      path: location.origin + location.pathname,
                      rootObject: this.viewer.scene,
                      loader: ROS3D.COLLADA_LOADER_2
                  })
      */
    },
    unset3DViewer: function () {
      document.getElementById('visualization-canvas').innerHTML = ''
    },
    sendCommand: function () {
      let topic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist'
      })
      let message = new ROSLIB.Message({
        linear: { x: 1, y: 0, z: 0, },
        angular: { x: 0, y: 0, z: 0.5, },
      })
      topic.publish(message)
    },
    startDrag() {
      this.dragging = true
      this.x = this.y = 0
    },
    stopDrag() {
      this.dragging = false
      this.x = this.y = 'no'
      this.dragCircleStyle.display = 'none'
      this.resetJoystickVals()
    },
    doDrag(event) {
      if (this.dragging) {
        this.x = event.offsetX
        this.y = event.offsetY
        let ref = document.getElementById('dragstartzone')
        this.dragCircleStyle.display = 'inline-block'

        let minTop = ref.offsetTop - parseInt(this.dragCircleStyle.height) / 2
        let maxTop = minTop + 200
        let top = this.y + minTop
        this.dragCircleStyle.top = `${top}px`

        let minLeft = ref.offsetLeft - parseInt(this.dragCircleStyle.width) / 2
        let maxLeft = minLeft + 200
        let left = this.x + minLeft
        this.dragCircleStyle.left = `${left}px`

        this.setJoystickVals()
      }
    },
    subsTF(tf) {
      // Update the camera position to match the base_link frame
      this.viewer.scene.position.x = -tf.translation.x
      this.viewer.scene.position.y = -tf.translation.y
    },
    mouseClickHandler(event) {
      let rect = event.target.getBoundingClientRect()
      let mouseX = -(event.clientX - rect.left - rect.width / 2)
      let mouseY = -(event.clientY - rect.top - rect.height / 2)

      let dpp = this.viewer.camera.position.z * Math.tan(Math.PI * (this.viewer.camera.fov / 2) / 180) / (rect.height / 2)
      console.log(dpp)
      console.log("X = " + dpp * mouseY + ", Y = " + dpp * mouseX)

      let mx = dpp * mouseY + this.viewer.camera.position.x - this.viewer.scene.position.x
      let my = dpp * mouseX + this.viewer.camera.position.y - this.viewer.scene.position.y
      console.log("MX = " + mx + ", MY = " + my)
      //let vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5)
    },
    setJoystickVals() {
      this.joystick.vertical = -1 * ((this.y / 200) - 0.5)
      this.joystick.horizontal = -1 * ((this.x / 200) - 0.5)
    },
    resetJoystickVals() {
      this.joystick.vertical = 0
      this.joystick.horizontal = 0
    },
    commandWaypoint: function (x, y, p, q, r, s) {
      let actionClient = new ROSLIB.ActionClient({
        ros: this.ros,
        serverName: '/move_base',
        actionName: 'move_base_msgs/MoveBaseAction'
      })
      let currentTime = new Date()
      let secs = Math.floor(currentTime.getTime() / 1000);
      let nsecs = Math.round(1000000000 * (currentTime.getTime() / 1000 - secs));
      this.goal = new ROSLIB.Goal({
        actionClient: actionClient,
        goalMessage: {
          target_pose: {
            header: {
              seq: 0,
              stamp: { secs: secs, nsecs: nsecs },
              frame_id: 'map'
            },
            pose: {
              position: { x: x, y: y, z: 0 },
              orientation: { x: p, y: q, z: r, w: s }
            }
          }
        }
      })

      this.goal.on('status', (status) => {
        this.action.status = status
      })

      this.goal.on('feedback', (feedback) => {
        this.action.feedback = feedback
      })

      this.goal.on('result', (result) => {
        this.action.result = result
        this.navigating = false
      })
      this.navigating = true
      this.goal.send()
    },
  },
  mounted() {
    this.interval = setInterval(() => {     // to keep the connection alive
      if (this.ros != null && this.ros.inConnected) {
        this.ros.getNodes((data) => { }, (error) => { })
      }
    }, 10000);
  },
})
