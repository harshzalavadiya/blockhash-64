import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import leven from "leven";
import { calculateImageMeta, imgDiff } from "./utils/hash.util";

export function MyDropzone() {
  const [response, setResponse] = useState([]);
  const [results, setResults] = useState();

  const onDrop = useCallback(async (acceptedFiles) => {
    const bhashes = await Promise.all(acceptedFiles.map(calculateImageMeta));
    setResponse(bhashes);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    if (response.length >= 2) {
      setResults(imgDiff(response[0], response[1]));
    }
  }, [response]);

  return (
    <div className="container">
      <div {...getRootProps({ className: "dropzone" })}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>

      <table cellSpacing={0}>
        <thead>
          <tr>
            <td>image</td>
            <td>blockHash</td>
            <td>date</td>
            <td>coordinates</td>
          </tr>
        </thead>
        <tbody>
          {response.map((img, index) => (
            <tr key={index}>
              <td>
                <img src={img.url} className="img" />
              </td>
              <td>
                <div title={img.blockHash} className="hash-block">
                  {img.blockHash}
                </div>
              </td>
              <td>{img.dateCreated.toISOString()}</td>
              <td>
                {img.latitude}, {img.longitude}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Results</h2>
      {results && (
        <table cellSpacing={0}>
          <thead>
            <tr>
              <td>blockhash</td>
              <td>date</td>
              <td>location</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{results.leven}/64</td>
              <td>{results.date} Seconds</td>
              <td>{results.geo} Meters</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
