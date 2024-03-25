import React, { useState, useEffect } from 'react';
import { fireDB, firestorage } from '../../firebase/FirebaseConfig';
import { ref, listAll, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { doc, collection, addDoc, query, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore'; // Updated Firestore imports

function UploadDocument() {
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [filename, setFilename] = useState('');
    const [userFiles, setUserFiles] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const currentUser = JSON.parse(storedUser);
            setCurrentUser(currentUser); // Set current user in state
            fetchUserFiles(currentUser.user.uid);
        } else {
            setCurrentUser(null); // No current user available
        }
    }, []); // Empty dependency array ensures the effect runs only once on mount

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
    };

    const handleFilenameChange = (e) => {
        setFilename(e.target.value);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file to upload');
            return;
        }
        if (!filename.trim()) {
            toast.error('Please enter a filename');
            return;
        }
    
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            toast.error('User information not found. Please log in.');
            return;
        }
        const currentUser = JSON.parse(storedUser);
    
        try {
            const documentId = uuidv4();
            const storageRef = ref(firestorage, `documents/${currentUser.user.uid}/${filename}_${documentId}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
    
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error('Error uploading document: ', error);
                    toast.error('Failed to upload document');
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log('File available at', downloadURL);
                        toast.success('Document uploaded successfully');
    
                        const pdfBytes = await fetchPdf(downloadURL);
                        let numPages = 0;
                        if (pdfBytes) {
                            const pdfDoc = await PDFDocument.load(pdfBytes);
                            numPages = pdfDoc.getPageCount();
                            console.log('Number of pages:', numPages);
                        } else {
                            throw new Error('Failed to fetch PDF');
                        }
    
                        // Add document using Firestore version 9 syntax
                        await addDoc(collection(fireDB, 'files'), {
                            userId: currentUser.user.uid,
                            filename: filename,
                            fileId: documentId,
                            numPages: numPages
                        });
    
                        fetchUserFiles(currentUser.user.uid);
    
                        setFile(null);
                        setFilename('');
                        setUploadProgress(0);
                    } catch (error) {
                        console.error('Error fetching PDF:', error);
                        toast.error('Failed to fetch PDF');
                    }
                }
            );
        } catch (error) {
            console.error('Error uploading document: ', error);
            toast.error('Failed to upload document');
        }
    };
    
    
    const fetchPdf = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch PDF');
            }
            return await response.arrayBuffer();
        } catch (error) {
            console.error('Error fetching PDF:', error);
            return null;
        }
    };

    const fetchUserFiles = async (userId) => {
        try {
            const userFilesRef = ref(firestorage, `documents/${userId}`);
            const userFilesList = await listAll(userFilesRef);
            const filesArray = [];
    
            for (const fileItem of userFilesList.items) {
                const fileName = fileItem.name.split('_')[0]; // Extract only the filename
                const fileId = fileItem.name.split('_')[1]; // Extract only the fileId
                const downloadURL = await getDownloadURL(fileItem);
    
                // Fetch file data from Firestore
                const fileQuery = query(collection(fireDB, 'files'), where('fileId', '==', fileId));
                const querySnapshot = await getDocs(fileQuery);
                let numPages = 'Unknown';
                let pageColor = 'black_and_white'; // Default value for pageColor
                let pageLayout = 'single_page'; // Default value for pageLayout
                let pageOrientation = 'horizontal'; // Default value for pageOrientation
                if (!querySnapshot.empty) {
                    const fileData = querySnapshot.docs[0].data();
                    numPages = fileData.numPages;
                    if (fileData.pageColor) {
                        pageColor = fileData.pageColor;
                    }
                    if (fileData.pageLayout) {
                        pageLayout = fileData.pageLayout;
                    }
                    if (fileData.pageOrientation) {
                        pageOrientation = fileData.pageOrientation;
                    }
                }
    
                filesArray.push({
                    name: fileName,
                    downloadURL: downloadURL,
                    id: fileId, // Use only the fileId
                    numPages: numPages, // Include number of pages in the file object
                    pageColor: pageColor, // Include pageColor
                    pageLayout: pageLayout, // Include pageLayout
                    pageOrientation: pageOrientation // Include pageOrientation
                });
            }
    
            setUserFiles(filesArray);
        } catch (error) {
            console.error('Error fetching user files:', error);
            toast.error('Failed to fetch user files');
        }
    };
    
    
    const deleteFileFromStorage = async (userId, filename, fileId) => {
        try {
            const filePath = `documents/${userId}/${filename}_${fileId}`;
            await deleteObject(ref(firestorage, filePath));
            toast.success('File deleted successfully from storage');
        } catch (error) {
            console.error('Error deleting file from storage:', error);
            toast.error('Failed to delete file from storage');
        }
    };

    const deleteFileFromDatabase = async (fileId) => {
        try {
            const fileQuery = query(collection(fireDB, 'files'), where("fileId", "==", fileId));
            const querySnapshot = await getDocs(fileQuery);

            if (querySnapshot.empty) {
                console.error('No matching documents found for fileId:', fileId);
                toast.error('File not found');
                return;
            }

            const deletePromises = querySnapshot.docs.map(async (doc) => {
                await deleteDoc(doc.ref);
            });

            await Promise.all(deletePromises);

            toast.success('File deleted successfully from database');
        } catch (error) {
            console.error('Error deleting file from database:', error);
            toast.error('Failed to delete file from database');
        }
    };

    const handleDeleteFile = async (fileId, filename) => {
        try {
            // Delete file from storage
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                toast.error('User information not found. Please log in.');
                return;
            }
            const currentUser = JSON.parse(storedUser);
            await deleteFileFromStorage(currentUser.user.uid, filename, fileId);
            
            // Delete file from database
            await deleteFileFromDatabase(fileId);

            // Fetch updated user files
            fetchUserFiles(currentUser.user.uid);
    
            toast.success('File deleted successfully');
        } catch (error) {
            console.error('Error deleting file:', error);
            toast.error('Failed to delete file');
        }
    };
    
    const getFileNumPages = async (fileId) => {
        try {
            const fileQuery = query(collection(fireDB, 'files'), where('fileid', '==', fileId));
            const fileSnapshot = await getDocs(fileQuery);
            if (!fileSnapshot.empty) {
                const fileData = fileSnapshot.docs[0].data();
                return fileData.numPages;
            }
            return 'Unknown';
        } catch (error) {
            console.error('Error fetching file metadata:', error);
            return 'Unknown';
        }
    };


    const handlePageColorChange = async (fileId, color) => {
        try {
            const fileQuery = query(collection(fireDB, 'files'), where("fileId", "==", fileId));
            const querySnapshot = await getDocs(fileQuery);
            if (!querySnapshot.empty) {
                const fileRef = doc(fireDB, 'files', querySnapshot.docs[0].id);
                await updateDoc(fileRef, {
                    pageColor: color
                });
                toast.success('Page color updated successfully');
            } else {
                console.error('No matching document found for fileId:', fileId);
                toast.error('File not found');
            }
        } catch (error) {
            console.error('Error updating page color:', error);
            toast.error('Failed to update page color');
        }
    };
    
    // Function to handle changes in page orientation
    const handlePageOrientationChange = async (fileId, orientation) => {
        try {
            const fileQuery = query(collection(fireDB, 'files'), where("fileId", "==", fileId));
            const querySnapshot = await getDocs(fileQuery);
            if (!querySnapshot.empty) {
                const fileRef = doc(fireDB, 'files', querySnapshot.docs[0].id);
                await updateDoc(fileRef, {
                    pageOrientation: orientation
                });
                toast.success('Page orientation updated successfully');
            } else {
                console.error('No matching document found for fileId:', fileId);
                toast.error('File not found');
            }
        } catch (error) {
            console.error('Error updating page orientation:', error);
            toast.error('Failed to update page orientation');
        }
    };
    
    // Function to handle changes in page layout
    const handlePageLayoutChange = async (fileId, layout) => {
        try {
            const fileQuery = query(collection(fireDB, 'files'), where("fileId", "==", fileId));
            const querySnapshot = await getDocs(fileQuery);
            if (!querySnapshot.empty) {
                const fileRef = doc(fireDB, 'files', querySnapshot.docs[0].id);
                await updateDoc(fileRef, {
                    pageLayout: layout
                });
                toast.success('Page layout updated successfully');
            } else {
                console.error('No matching document found for fileId:', fileId);
                toast.error('File not found');
            }
        } catch (error) {
            console.error('Error updating page layout:', error);
            toast.error('Failed to update page layout');
        }
    };
    

    const handlePrintRequest = async (fileId, filename, numPages, pageColor, pageOrientation, pageLayout, downloadURL) => {
        console.log('File object:', fileId, filename, numPages, pageColor);
        try {
            // Calculate print request amount based on the number of pages and color options
            let printAmount = 0;
            if (pageColor === 'color') {
                printAmount = 5 * numPages;
            } else {
                printAmount = 2 * numPages;
            }

            // Create Razorpay order
            const options = {
                key: "rzp_test_ONoX2G2lgjLNA9",
                key_secret: "cycrdaBhmV3DydSw1mHZMUKo",
                amount: printAmount * 100, // Amount in paisa
                currency: 'INR',
                receipt: 'print_request_' + uuidv4(),
                name: 'E-Bharat',
                description: 'Print Request',
                payment_method: {
                    wallets: ['upi']
                },
                handler: function (response) {
                    // Payment success
                    const paymentId = response.razorpay_payment_id;
                    // Store print request data in Firestore
                    const printRequestData = {
                        downloadURL: downloadURL,
                        userId: currentUser.user.uid,
                        email: currentUser.user.email,
                        filename: filename,
                        fileId: fileId,
                        numPages: numPages,
                        pageColor: pageColor,
                        pageOrientation: pageOrientation,
                        pageLayout:pageLayout,
                        paymentId: paymentId,
                        timestamp: new Date().toLocaleString(),
                        orderFullFilled: false
                    };
                    addDoc(collection(fireDB, 'printreq'), printRequestData)
                        .then(() => {
                            toast.success('Print request placed successfully');
                        })
                        .catch((error) => {
                            console.error('Error storing print request data:', error);
                            toast.error('Failed to place print request');
                        });
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Error handling print request:', error);
            toast.error('Failed to place print request');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="p-5 rounded-lg bg-gray-100 drop-shadow-xl border border-gray-200 w-4/5 my-10">
                <h1>Upload Document</h1>
                <input type="file" onChange={handleFileChange} />
                <input type="text" placeholder="Enter filename" value={filename} onChange={handleFilenameChange} />
                <button onClick={handleUpload}>Upload</button>
                {uploadProgress > 0 && <progress value={uploadProgress} max="100">{uploadProgress}%</progress>}
            </div>
            {/* Display user files */}
            <div className="mt-5">
                <h2>User Files:</h2>
                <ul>
                {userFiles.map((file, index) => (
                <li key={index}>
                    <a href={file.downloadURL} target="_blank" rel="noopener noreferrer">{file.name}</a>
                    <button onClick={() => handleDeleteFile(file.id, file.name)}>Delete</button>
                    <select value={file.pageColor} onChange={(e) => handlePageColorChange(file.id, e.target.value)}>
                        <option value="black_and_white">Black and White</option>
                        <option value="color">Color</option>
                    </select>
                    <select value={file.pageOrientation} onChange={(e) => handlePageOrientationChange(file.id, e.target.value)}>
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                    </select>
                    <select value={file.pageLayout} onChange={(e) => handlePageLayoutChange(file.id, e.target.value)}>
                        <option value="single_page">Single Page</option>
                        <option value="front_and_back">Front & Back</option>
                    </select>
                    {file.numPages}
                    <button onClick={() => handlePrintRequest(file.id, file.name, file.numPages, file.pageColor, file.pageOrientation, file.pageLayout, file.downloadURL)}>Print Request</button>
                </li>
            ))}

                </ul>
            </div>
        </div>
    );
}

export default UploadDocument;
