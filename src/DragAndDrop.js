import React, { useState, useEffect } from "react";
import "./index.css";
import { parse } from "papaparse";

const DragAndDrop = () => {
    const [fileData, setFileData] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [mes, setMes] = useState([]);
    let rows = 0;

    

    const handleDrop = (e) => {
        e.preventDefault();

        // setDragging(false);
        const file = e.dataTransfer.files[0];
        const fileName = file.name;
        const fileExtension = fileName.split(".").pop();
      
        // Check if the file extension is not "csv"
        if (fileExtension.toLowerCase() !== "csv") {
          setErrorMessage("Invalid file type. Please upload a CSV file.");
          return; // Return early to prevent further execution
        }
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
              setMes(data);
              rows = mes.map(item => (
                <tr key={item.name}>
                  <td>{item.error}</td>
                  <td>{item.message}</td>
                  <td>{item.name}</td>
                </tr>
              )
              );
            });
          };
    };
  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  return (
    <div>
    <div
      className={`drop-area${dragging ? " dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <p>Drag and drop files here</p>
    </div>
    {mes.length > 0 && (
    <table>
      <thead>
        <tr>
          <th>Error Type</th>
          <th>Message</th>
          <th>Table Name</th>
        </tr>
      </thead>
      <tbody>
        {mes.map((item) => (
          <tr key={item.name}>
            <td>{item.error}</td>
            <td>{item.message}</td>
            <td>{item.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
  {errorMessage && <h3>{errorMessage}</h3>}
    </div>
  );
};

export default DragAndDrop;