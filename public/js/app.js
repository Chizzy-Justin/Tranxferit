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
    // Disable the "Generate Link" button initially
    generateLink.disabled = true;
  
    // Drag-and-Drop Events
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
        fileInput.files = files; // Set dropped file to input
        updateDropAreaText(files[0]);
      }
    });
  
    // Click to Browse Files
    browseBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        updateDropAreaText(fileInput.files[0]);
      }
    });
  
    // Update Drop Area Text
    const updateDropAreaText = (file) => {
      if (file.size > 500 * 1024 * 1024) {
        alert("File exceeds the maximum size limit of 500MB.");
        fileInput.value = ""; // Clear input
      } else {
        dropArea.textContent = `Selected File: ${file.name}`;
        generateLink.disabled = false;
      }
    };
  
    // Handle File Upload with Progress Bar
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
  
      // Disable the button during upload
      generateLink.disabled = true;
  
      // Show Progress Bar
      uploadProgress.style.display = "block";
      uploadProgress.value = 0;
  
      // Track Upload Progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          uploadProgress.value = percentComplete;
        }
      };
  
      // Handle Upload Completion
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const link = response.link;
          linkOutput.innerHTML = `Your file link: <a href="${response.link}" target="_blank">${response.link}</a>`;
              // Show Copy Link button
              copyLinkBtn.style.display = "inline-block";

              // Store the generated link for copying
              copyLinkBtn.setAttribute("data-link", link);
        } else {
          linkOutput.textContent = "An error occurred. Please try again.";
        }
        resetUploadState();
      };
  
      // Handle Upload Errors
      xhr.onerror = () => {
        linkOutput.textContent = "An error occurred during upload.";
        resetUploadState();
      };
  
      // Send the File
      xhr.send(formData);
    });
  
    // Reset Upload State
    const resetUploadState = () => {
      uploadProgress.style.display = "none";
      generateLink.disabled = true;
      dropArea.textContent = "Drag & Drop your file here (Max: 500MB)";
      fileInput.value = ""; // Clear file input
    };
  
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
      // Copy Link Logic
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
    // Handle Download Button Click
    downloadBtn.addEventListener("click", async () => {
      const fileLink = fileLinkInput.value.trim();
      if (!fileLink) {
        alert("Please enter a file link.");
        return;
      }
  
      try {
        const response = await fetch(fileLink);
  
        if (response.ok) {
          const filename = fileLink.split("/").pop();
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
  
          // Create a temporary download link
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
  
          downloadOutput.innerHTML = `Your file is ready. <a href="${fileLink}" target="_blank">Download</a>`;
        } else {
          throw new Error("File not found.");
        }
      } catch (error) {
        downloadOutput.textContent = "Invalid link. Please try again.";
      }
    });
  });
  
  
  
  