document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("fileInput");
    const browseBtn = document.getElementById("browseBtn");
    const generateLink = document.getElementById("generateLink");
    const uploadProgress = document.getElementById("uploadProgress");
    const linkOutput = document.getElementById("linkOutput");
    const downloadBtn = document.getElementById("downloadBtn");
    const fileLinkInput = document.getElementById("fileLink");
    const downloadOutput = document.getElementById("downloadOutput");
    const copyLinkBtn = document.getElementById("copyLinkBtn");
  

    const yearElement = document.getElementById("currentYear");
    yearElement.textContent = new Date().getFullYear();
   
    generateLink.disabled = true;
  
   
    dropArea.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropArea.classList.add("drag-over");
    });
  
    dropArea.addEventListener("dragleave", () => {
      dropArea.classList.remove("drag-over");
    });
  
    dropArea.addEventListener("drop", (event) => {
      event.preventDefault();
      dropArea.classList.remove("drag-over");
  
      const files = event.dataTransfer.files;
      if (files.length) {
        fileInput.files = files; 
        updateDropAreaText(files[0]);
      }
    });
  
   
    browseBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        updateDropAreaText(fileInput.files[0]);
      }
    });
  
   
    const updateDropAreaText = (file) => {
      if (file.size > 500 * 1024 * 1024) {
        alert("File exceeds the maximum size limit of 500MB.");
        fileInput.value = ""; 
      } else {
        dropArea.textContent = `Selected File: ${file.name}`;
        generateLink.disabled = false;
      }
    };
  
   
    generateLink.addEventListener("click", () => {
      const file = fileInput.files[0];
      if (!file) {
        alert("Please select a file.");
        return;
      }
  
      const formData = new FormData();
      formData.append("file", file);
  
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/upload", true);
  
     
      generateLink.disabled = true;
  
      // Show Progress Bar
      uploadProgress.style.display = "block";
      uploadProgress.value = 0;
  
      // Track Upload Progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          document.getElementById("upload-progress-note").innerHTML = "file upload still in progress";
          uploadProgress.value = percentComplete;
        }
      };
  
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const link = response.link;
           document.getElementById("upload-progress-note").innerHTML = "file uploaded";
          linkOutput.innerHTML = `Your file link: <a href="${response.link}" target="_blank">${response.link}</a>`;
              copyLinkBtn.style.display = "inline-block";

              copyLinkBtn.setAttribute("data-link", link);
        } else {
          linkOutput.textContent = "An error occurred. Please try again.";
        }
        resetUploadState();
      };
      xhr.onerror = () => {
        linkOutput.textContent = "An error occurred during upload.";
        resetUploadState();
      };

      xhr.send(formData);
    });
  
    const resetUploadState = () => {
      uploadProgress.style.display = "none";
      generateLink.disabled = true;
       document.getElementById("upload-progress-note").innerHTML = "";
      dropArea.textContent = "Drag & Drop your file here (Max: 500MB)";
      fileInput.value = "";
    };
  
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
      
  copyLinkBtn.addEventListener("click", () => {
    const link = copyLinkBtn.getAttribute("data-link");
    if (link) {
      navigator.clipboard.writeText(link)
        .then(() => {
          alert("Link copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy link: ", err);
        });
    }
  });

    downloadBtn.addEventListener("click", async () => {
      const fileLink = fileLinkInput.value.trim();
      if (!fileLink) {
        alert("Please enter a file link.");
        return;
      }
    
      try {
       
        const resolveResponse = await fetch(fileLink);
    
        if (!resolveResponse.ok) {
          throw new Error("Unable to resolve the shortened link.");
        }
    
        const { fullUrl } = await resolveResponse.json();
    
        const fileResponse = await fetch(fullUrl);
    
        if (!fileResponse.ok) {
          throw new Error("File not found.");
        }
    
        const filename = fullUrl.split("/").pop(); 
        const blob = await fileResponse.blob();
        const url = window.URL.createObjectURL(blob);
    
        
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    
        downloadOutput.innerHTML = `Your file is ready. <a href="${fileLink}" target="_blank">Download</a>`;
      } catch (error) {
        downloadOutput.textContent = "Invalid or inaccessible link. Please try again.";
        console.error("Error:", error);
      }
    });
    
  });
  
  
  
  