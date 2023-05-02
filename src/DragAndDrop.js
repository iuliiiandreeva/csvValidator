import React, { useState } from "react";
import "./index.css";
import { parse } from "papaparse";

const DragAndDrop = () => {
    const [fileData, setFileData] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [message, setMessage] = useState("");

    const handleDrop = (e) => {
        e.preventDefault();

        // setDragging(false);
        const file = e.dataTransfer.files[0];
        console.log(file);
        const reader = new FileReader();
        reader.readAsText(file);

        reader.onload = () => {
            const csvData = reader.result;

            const { data } = parse(csvData, { header: true });
            setFileData(data);
          
            const formData = new FormData();
            formData.append('file', file);
            // test
            fetch('http://localhost:8000/upload', {
              method: 'POST',
              body: formData
            })
            .then(response => response.json())
            .then(data => {
              setMessage(data);
              console.log(data);
            });
            
            console.log(data[0]);
          };  
        // const csvData = reader.result;

        // const { data } = parse(csvData, { header: true });

        // // set file data state
        // setFileData(data);


        // console.log(data[0]);

        // log table to console
        // createSchema(data);
        
    };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  return (
    <div
      className={`drop-area${dragging ? " dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <p>Drag and drop files here</p>
      <h1>{message && <p>{message.response}</p>}</h1>
    </div>
  );
};

export default DragAndDrop;