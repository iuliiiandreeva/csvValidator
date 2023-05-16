import React, { useState } from 'react';
import { parse } from "papaparse";
import axios from 'axios';

const UploadComponent = () => {
  const [fileData, setFileData] = useState([]);
  const [JSONFile, setJSONFile] = useState();
  const [dragging, setDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState("");
  const [mes, setMes] = useState([]);
  const [ids, setIds] = useState([]);
  let rows = 0;

  const handleDropCSV = (e) => {
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
        fetch('http://localhost:8000/uploadedTable', {
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
        }).then(() => {
          axios.delete('http://localhost:3001/uploadedTables/1')}
        );
      };
  };

  const uploadDataToServer = (jsonData) => {
    axios.post('http://localhost:3001/uploadedTables', jsonData)
      .then((response) => {
        console.log('Data uploaded successfully:', response.data);
      })
      .catch((error) => {
        console.error('Error uploading data:', error);
      });
  };


  const handleDropJSON = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
  
    reader.onload = (event) => {
      const jsonData = JSON.parse(event.target.result);
      let id = 1;
      const dataWithId = { id, ...jsonData };
      uploadDataToServer(dataWithId);
      // Call a function to upload the JSON data to the JSON server
    };
  
    reader.readAsText(file);
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
      onDrop={handleDropCSV}
    >
      <p>Drag and drop csv here</p>
    </div>
    <br></br>
    <br></br>
    <div
        className={`drop-area${dragging ? " dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropJSON}
      >
        <p>Drag and drop JSON here</p>
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

export default UploadComponent;
