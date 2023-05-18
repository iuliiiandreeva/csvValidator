import React, { useState } from "react";
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
            const lines = csvData.split('\n');
            let delimiter = '';
            const firstLine = csvData.slice(0, csvData.indexOf('\n'));
            if (firstLine.includes(',')) {
              delimiter = ',';
            } else if (firstLine.includes(';')) {
              delimiter = ';';
            } else {
              setErrorMessage('Unable to determine the CSV delimiter.');
              return;
            }

            for (let i = 1; i < lines.length - 1; i++) {
              const columns = lines[i].split(delimiter);
              console.log(columns);
      
              if (columns.some((column) => column.trim() === '')) {
                // Empty data found in the CSV file
                setErrorMessage('CSV файл содержит пустые ячейки.');
                return;
              }
            }

            const { data } = parse(csvData, { header: true, delimiter: delimiter });
            setFileData(data);
            console.log(11111);
            console.log(file);
            console.log(data);
          
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
              // console.log(data);
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
            <td> {item.message.length > 500 ? `${item.message.slice(0, 500)}...` : item.message}}</td>
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