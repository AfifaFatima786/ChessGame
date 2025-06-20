const username = window.currentUsername || "Unknown";
const socket = io();
const chess=new Chess();
const boardElement=document.querySelector(".chessboard");



let draggedPiece=null;
let sourceSquare=null;
let playerRole=null;
let gameStarted = false;


const renderBoard=()=>{
    const board=chess.board();

    
    

    boardElement.innerHTML="";  /*phle se jo hai use delete krdo*/
    board.forEach((row,rowindex)=>{
        row.forEach((square,squareindex)=>{
            const squareElement=document.createElement("div");
            squareElement.classList.add(
                "square",(rowindex+squareindex)%2===0?"light":"dark",
                
            );        /* its just that we r using classlist features to create div and style them in javascript?*/
       
            console.log(square)
    squareElement.dataset.row=rowindex;
    squareElement.dataset.col=squareindex;
    /* we are locating the exact location of a particular square element in the board ....dataset is the standard way to give custom attribute row/col to squareElement div.*/

    if(square){
        const pieceElement=document.createElement("div");
        pieceElement.classList.add(
            "piece", square.color==="w"?"white":"black"
        );    /* peices will be arranged based on color*/
    

     pieceElement.innerHTML=getPieceUnicode(square);
     pieceElement.draggable=gameStarted && playerRole===square.color;
     /*square.color is the color of piece on it not the square ...now square.color is the color of piece on it while squareElement.color is the color of background div on which peice is placed. Also playerrole consist of the color which is working currently(w or b) */

      pieceElement.addEventListener("dragstart",(e)=>{
        /*Whenever the user starts dragging this element(pieceElement), run this function*/


        if(pieceElement.draggable){
            draggedPiece=pieceElement;
            sourceSquare={row:rowindex,col:squareindex};
            e.dataTransfer.setData("text/plain","");
        }
      });

      pieceElement.addEventListener("dragend",(e)=>{
        draggedPiece=null;
        sourceSquare=null;
        
      })

      squareElement.appendChild(pieceElement);
    
    }

    

    squareElement.addEventListener("dragover",function(e){
        e.preventDefault();
    })

    squareElement.addEventListener("drop",function(e){
        e.preventDefault();
        if(draggedPiece){
            const targetSource={
                row:parseInt(squareElement.dataset.row),
                col:parseInt(squareElement.dataset.col),
            };
            handleMove(sourceSquare,targetSource)
        }
    });
    boardElement.appendChild(squareElement);

     const turn = chess.turn()
    const statusElement = document.getElementById("status");
    if (statusElement) {
        if (playerRole === null) {
        statusElement.textContent = "You are spectating.";
    } else if (playerRole === turn) {
        statusElement.textContent = "Your move.";
    } else {
        statusElement.textContent = "Waiting for opponent...";
    }
}
    }); 
    });




};




const handleMove=(sourceSquare,targetSource)=>{
    const move={
        from:`${String.fromCharCode(97+sourceSquare.col)}${8-sourceSquare.row}`,
        to:`${String.fromCharCode(97+targetSource.col)}${8-targetSource.row}`,
        promotion:'q',

    }

    socket.emit("move",move);
}

const getPieceUnicode=(piece)=>{

const unicodePieces = {
  // White pieces (uppercase in chess.js)
  'K': '♔', // White King
  'Q': '♕', // White Queen
  'R': '♖', // White Rook
  'B': '♗', // White Bishop
  'N': '♘', // White Knight
  'P': '♙', // White Pawn

  // Black pieces (lowercase in chess.js)
  'k': '♚', // Black King
  'q': '♛', // Black Queen
  'r': '♜', // Black Rook
  'b': '♝', // Black Bishop
  'n': '♞', // Black Knight
  'p': '♙'  // Black Pawn
};
return unicodePieces[piece.type] || ""
}

socket.on("playerRole",function(role){
    playerRole=role;
    renderBoard();
})
socket.on("spectatorRole",function(){
    playerRole=null;
    renderBoard();
})
socket.on("boardState",function(fen){
    chess.load(fen);
    renderBoard();
})

socket.on("playerLeft",function(message){
            alert("Game Over: " + message);
            chess.reset();
            renderBoard();
})

socket.on("timerTick", function(data) {
    const timerElement = document.getElementById("timer");
    if (timerElement) {
        const minutes = Math.floor(data.timeLeft / 60).toString().padStart(2, '0');
        const seconds = (data.timeLeft % 60).toString().padStart(2, '0');
        timerElement.textContent = `${minutes}:${seconds}`;
    }
});


socket.on("move",function(move){
    chess.move(move);
    renderBoard();
})


socket.on("waitForPlayer", () => {
    gameStarted = false;
    const statusElement = document.getElementById("status");
    if (statusElement) {
        statusElement.textContent = "Waiting for another player to join...";
    }
});

socket.on("gameStart", () => {
    gameStarted = true;
    renderBoard();
});


//chat
// DOM refs
  const chatOverlay = document.getElementById("chat-overlay");
  const chatPreview = document.getElementById("chat-preview");
  const closeBtn = document.getElementById("close-chat");
  const chatBox = document.getElementById("chat-box");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");

  // Open full chat on preview click
  chatPreview.addEventListener("click", () => {
    chatOverlay.classList.add("active");
    chatOverlay.classList.remove("hidden");
  });

  // Close full chat
  closeBtn.addEventListener("click", () => {
    chatOverlay.classList.remove("active");
    chatOverlay.classList.add("hidden");
  });

  // Send message
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (message) {
      socket.emit("chatMessage", { message });
      chatInput.value = "";
    }
  });

  // Receive message
  socket.on("chatMessage", ({ message, sender }) => {

    const isMe = sender === window.currentUsername;

    const msgWrapper = document.createElement("div");
    msgWrapper.className = `w-full flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`;

    const msg = document.createElement("div");
    msg.className = `px-3 py-2 rounded-lg max-w-[70%] ${isMe ? 'bg-orange-500 text-white' : 'bg-zinc-600 text-white'}`;
    msg.textContent = message;

    msgWrapper.appendChild(msg);
    chatBox.appendChild(msgWrapper);
    chatBox.scrollTop = chatBox.scrollHeight;

 
  });








renderBoard();