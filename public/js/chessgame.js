const socket = io();
const chess=new Chess();
const boardElement=document.querySelector(".chessboard");



let draggedPiece=null;
let sourceSquare=null;
let playerRole=null;

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
     pieceElement.draggable=playerRole===square.color;
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


// const timer = (() => {
//   let count = 10 * 60; // 10 minutes in seconds

//   const interval = setInterval(() => {
//     if (count <= 0) {
//       clearInterval(interval);
//       document.getElementById("timer").textContent = "Time's up!";
//       return;
//     }

//     count--;

//     const minutes = Math.floor(count / 60).toString().padStart(2, '0');
//     const seconds = (count % 60).toString().padStart(2, '0');
//     document.getElementById("timer").textContent = `${minutes}:${seconds}`;
//   }, 1000); 
// })();

// socket.io("/profile",async function(req,res){

//     const user = await userModel.findById(req.user);
//     socket.emit("profile ckicked");
   
// })


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

socket.on("move",function(move){
    chess.move(move);
    renderBoard();
})







renderBoard();