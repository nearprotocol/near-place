// Loads nearlib and this contract into nearplace scope.
nearplace = {};
let initPromise;
initContract = function () {
  if (nearplace.contract) {
    return Promise.resolve();
  }
  if (!initPromise) {
    initPromise = doInitContract();
  }
  return initPromise;
}

async function doInitContract() {
  const config = await nearlib.dev.getConfig();
  console.log("nearConfig", config);
  nearplace.near = await nearlib.dev.connect();
  nearplace.contract = await nearplace.near.loadContract(config.contractName, {
    viewMethods: ["getMap", "getChunk"],
    changeMethods: ["setPixel"],
    sender: nearlib.dev.myAccountId
  });

  loadBoardAndDraw().catch(console.error);
  nearplace.timedOut = false;
  const timeOutPeriod = 10 * 60 * 1000; // 10 min
  setTimeout(() => { nearplace.timedOut = true; }, timeOutPeriod);
}

function sleep(time) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, time);
  });
}

initContract().catch(console.error);

const CHUNK_SIZE = 16;
let lastMap = null;
let fullMap = [];
async function loadBoardAndDraw() {
  if (nearplace.timedOut) {
    console.log("Please reload to continue");
    return;
  }

  console.log("getMap");
  const map = await nearplace.contract.getMap();
  for (let i = 0; i < map.length; i++) {
    if (!lastMap) {
      fullMap.push(Array(map[i].length));
    }
    for (let j = 0; j < map[i].length; j++) {
      if (!lastMap || lastMap[i][j] != map[i][j]) {
        console.log("getChunk", i, j);
        let chunk = await nearplace.contract.getChunk({x: i * CHUNK_SIZE, y: j * CHUNK_SIZE});
        fullMap[i][j] = chunk;
        drawMap();
      }
    }
  }
  lastMap = map;

  setTimeout(loadBoardAndDraw, 5000);
}

let setPixelQueue = [];
function drawMap() {
  if (setPixelQueue.length > 0) {
    return;
  }
  let canvas = document.getElementById("myCanvas");
  let ctx = canvas.getContext("2d");
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < fullMap.length; i++) {
    for (let j = 0; j < fullMap[i].length; j++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
          let color = (fullMap[i][j] && fullMap[i][j].rgb[x][y]) || '000000';
          ctx.fillStyle = "#" + color;
          ctx.fillRect((i * CHUNK_SIZE + x) * 10, (j * CHUNK_SIZE + y) * 10, 10, 10);
        }
      }
    }
  }
}

function getMousepos(canvas, evt){
  let rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function myCanvasClick(e) {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");
  const position = getMousepos(canvas, e);
  const x = Math.floor(position.x/10);
  const y = Math.floor(position.y/10);

  const rgb = document.getElementById('picker').value;
  ctx.fillStyle = "#" + rgb;
  ctx.fillRect(x*10, y*10, 10, 10);

  setPixelQueue.push({ x, y, rgb });
  function setNextPixel() {
    nearplace.contract.setPixel(setPixelQueue[0]).finally(() => {
      setPixelQueue.splice(0, 1);
      if (setPixelQueue.length == 0) {
        loadBoardAndDraw();
      } else {
        setNextPixel();
      } 
    });
  }
  if (setPixelQueue.length == 1) {
    setNextPixel();
  }
}