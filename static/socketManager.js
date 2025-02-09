var socket = io.connect('http://' + document.domain + ':' + location.port);

export default socket;