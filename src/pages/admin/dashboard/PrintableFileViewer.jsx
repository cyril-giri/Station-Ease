import React, { useState } from 'react';

function PrintableFileViewer({ downloadURL }) {
    const [fileLoaded, setFileLoaded] = useState(false);

    const handleLoad = () => {
      setFileLoaded(true);
    };
  
    const handlePrint = () => {
        if (fileLoaded) {
          const frame = window.frames['documentFrame'];
          if (frame) {
            frame.focus();
            frame.print();
          } else {
            console.error('Frame not found');
          }
        } else {
          console.log('File not loaded yet');
        }
      };

  return (
    <div>
      {console.log(downloadURL)}
      <iframe src={downloadURL} width="500" height="300" title="Document" onLoad={handleLoad}></iframe>
    
      <button className="px-2 py-2 rounded-full text-white bg-red-500 mr-5" style={{ borderRadius: '30px' }} onClick={() => handlePrint()}>Print</button>
    </div>
  );
}

export default PrintableFileViewer;
