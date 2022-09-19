import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { calculateImageMeta, imgDiff } from "./utils/hash.util";
import setClustering from "set-clustering";

export function MyDropzone() {
  const [response, setResponse] = useState([]);
  const [results, setResults] = useState();

  const onDrop = useCallback(async (acceptedFiles) => {
    const bhashes = await Promise.all(acceptedFiles.map(calculateImageMeta));
    setResponse(bhashes);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    const cluster = setClustering(response, (imageA, imageB) => {
      return imgDiff(imageA, imageB);
    });
    setResults(cluster.similarGroups(0.5));
  }, [response]);

  return (
    <div className="container">
      <div {...getRootProps({ className: "dropzone" })}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drop Images to cluster</p>
        )}
      </div>

      {results &&
        results.map((images, idx) => (
          <div key={idx}>
            {images.map((img) => (
              <span key={img.url}>
                <img
                  src={img.url}
                  className="img"
                  title={`Date: ${img.dateCreated}\nLocation: ${img.latitude},${img.longitude}`}
                />
              </span>
            ))}
            <hr />
          </div>
        ))}

      {response.length > 0 && (
        <details>
          <summary>Selected Images</summary>
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
                  <td>{img.dateCreated?.toISOString()}</td>
                  <td>
                    {img.latitude || "NA"}, {img.longitude || "NA"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
