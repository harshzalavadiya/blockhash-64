import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
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
          <p>Drop any 2 Images to compare</p>
        )}
      </div>

      {response.length > 0 && (
        <>
          <h2>Selected Images</h2>
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
                    {img.latitude || "NA"}, {img.longitude || "NA"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {results && (
        <>
          <h2>Results</h2>
          <table cellSpacing={0}>
            <thead>
              <tr>
                <td>Similarity</td>
                <td>Time Difference</td>
                <td>Location Difference</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{results.distance}/1</td>
                <td>{results.date} Seconds</td>
                <td>{response[0].latitude ? results.geo : "-"} Meters</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
