var imageUrlMarkup = [
  '<div class="row location-image">',
  '<div class="eleven columns">',
  '<input class="u-full-width" type="text" value="var_url" name="imageUrls"/>',
  '</div>',
  '<div class="one columns close">',
  '<a class="close">X</a>',
  '</div>',
  '</div>'
];

var newImage = function() {

}

function displaySelectedFile() {
  var fileName = this.value.split( '\\' ).pop();
  this.nextElementSibling.nextElementSibling.value = fileName;
}

var uploadInputs = document.querySelectorAll('.upload-image .path');
for(var i=0; i<uploadInputs.length; i++) {
  uploadInputs[i].addEventListener('change', displaySelectedFile);
}

var images = document.querySelectorAll('.upload-image a.upload');
for(var i=0; i<images.length; i++) {
  images[i].addEventListener('click', initiateUpload);
}

function initiateUpload() {
  var uploadContainer = this.parentNode;

  var filesInput = uploadContainer.querySelector('.path');
  var files = filesInput.files;
  var file = files[0];

  if(file == null){
    return alert('No file selected.');
  }

  var urlTarget = uploadContainer.parentNode.parentNode.querySelector('div.location-images');

  var placeholder = document.createElement('i');
  placeholder.className = "fas fa-spinner fa-2x placeholder";

  urlTarget.appendChild(placeholder);

  getSignedRequest(filesInput, file, urlTarget, placeholder);
}

function getSignedRequest(initiator, file, target, placeholder) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/nimda/signS3?name=' + encodeURIComponent(file.name) + '&type=' + encodeURIComponent(file.type));
  xhr.onreadystatechange = function() {
    if(xhr.readyState === 4) {
      if(xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        uploadFile(initiator, file, response.signedRequest, response.url, target, placeholder);
      } else {
        alert('Could not get signed URL.');
      }
    }
  };
  xhr.send();
}

function uploadFile(initiator, file, signedRequest, url, target, placeholder){
  var xhr = new XMLHttpRequest();
  xhr.open('PUT', signedRequest);
  xhr.onreadystatechange = function () {
    if(xhr.readyState === 4) {
      if(xhr.status === 200) {
        addUploadedImageUrl(initiator, file.name, target);
        target.removeChild(placeholder);
//        target.value = url;
      } else {
        alert('Could not upload file.');
      }
    }
  };
  xhr.send(file);
}

var addUploadedImageUrl = function(initiator, fileName, container) {
  var dummyNode = document.createElement('div');
  var imageUrl = imageUrlMarkup.join('').replace('var_url', cdn + fileName);
  dummyNode.innerHTML = imageUrl;
  dummyNode = dummyNode.firstChild;

  container.appendChild(dummyNode);
  var dummyClose = dummyNode.querySelector('a.close');

  if(dummyClose) dummyClose.addEventListener('click', deleteImageUrl);

  initiator.value='';
  initiator.value=null;

  initiator.nextElementSibling.nextElementSibling.value = '';
}

var deleteImageUrl = function(){
  var imageUrlRow = this.parentNode.parentNode;
  if(imageUrlRow.classList.contains('location-image') && imageUrlRow.parentNode){
    imageUrlRow.parentNode.removeChild(imageUrlRow);
  }
}

var closeButtons = document.querySelectorAll('.nimda .location-images a.close');
for(var i=0; i<closeButtons.length; i++) {
  closeButtons[i].addEventListener('click', deleteImageUrl);
}

var resetButtons = document.querySelectorAll('.nimda a.reset');
for(var i=0; i<resetButtons.length; i++) {
  resetButtons[i].addEventListener('click', function(){
    window.location.reload(true);
  });
}

var newLocation = document.getElementById('add-new-location');
if(newLocation) {
  newLocation.addEventListener('click', function(){
    var hiddenLocation = document.querySelector('div.location.new.hidden');
    if(hiddenLocation) {
      hiddenLocation.classList.remove('hidden');
      hiddenLocation.querySelector('.heading').click();
    }
  });
}
