function enviarVouchers() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var templateId = "1Jz7v5KLGfDHbrKorZ8xL4762wlo2KyDWnsCUI4YEacw";
    var folderId = "1GzoYBJ5JhXf1zWxUVCB95AciiTQKYCrt";
    var imageUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTt2yev80WhCSD9g0dlolRa8-_gn_7fGFZFmg&s";
    var imageWidth = 70;
    var imageHeight = 60;
  
    var groupedData = getGroupedData(data);
    var logoImage = UrlFetchApp.fetch(imageUrl).getBlob();
    var templateFile = DriveApp.getFileById(templateId);
    var folder = DriveApp.getFolderById(folderId);
  
    var properties = PropertiesService.getScriptProperties();
    var state = properties.getProperties();
    var currentIndex = state.currentIndex ? parseInt(state.currentIndex) : 0;
  
    var qrImageCache = {};
    var barcodeImageCache = {};
  
    // Procesar tres órdenes en cada ejecución
    var processLimit = 100;
    var processedCount = 0;
  
    var ordenes = Object.keys(groupedData);
  
    for (var i = currentIndex; i < ordenes.length; i++) {
      var orden = ordenes[i];
  
      processVoucher(orden, groupedData[orden], templateFile, folder, logoImage, qrImageCache, barcodeImageCache, imageWidth, imageHeight);
      processedCount++;
      currentIndex++;
  
      if (processedCount >= processLimit) {
        // Guardar el índice actual y programar la siguiente ejecución
        properties.setProperty('currentIndex', currentIndex);
        ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger));
        ScriptApp.newTrigger('enviarVouchers')
          .timeBased()
          .after(1000) // 1 segundo
          .create();
        return;
      }
    }
  
    properties.deleteAllProperties();
    ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger));
  }
  
  function getGroupedData(data) {
    var groupedData = {};
    for (var i = 1; i < data.length; i++) {
      var orden = data[i][0];
      if (!groupedData[orden]) {
        groupedData[orden] = [];
      }
      groupedData[orden].push({row: i + 1, values: data[i]});
    }
    return groupedData;
  }
  
  function processVoucher(orden, entries, templateFile, folder, logoImage, qrImageCache, barcodeImageCache, imageWidth, imageHeight) {
    var entry = entries[0].values;
    var client_Name = entry[3];
    var client_Last_Name = entry[4];
    var email = entry[6];
    var voucherID = orden;
  
    var formattedDate1 = Utilities.formatDate(new Date(entry[2]), Session.getScriptTimeZone(), 'dd/MM/yyyy');
    var formattedDate2 = Utilities.formatDate(new Date(entry[21]), Session.getScriptTimeZone(), 'dd/MM/yyyy');
  
    if (!qrImageCache[orden]) {
      var qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?data=" + encodeURIComponent(orden) + "&size=150x150";
      qrImageCache[orden] = UrlFetchApp.fetch(qrCodeUrl).getBlob();
    }
  
    if (!barcodeImageCache[orden]) {
      var barcodeUrl = "https://barcode.tec-it.com/barcode.ashx?data=" + encodeURIComponent(orden) + "&code=Code128&dpi=96";
      barcodeImageCache[orden] = UrlFetchApp.fetch(barcodeUrl).getBlob();
    }
  
    var copiaTemplate = templateFile.makeCopy('Voucher_' + voucherID, folder);
    var doc = DocumentApp.openById(copiaTemplate.getId());
    var body = doc.getBody();
  
    var replacements = {
      '{{nombrecliente}}': client_Name,
      '{{apellidocliente}}': client_Last_Name,
      '{{dni}}': entry[5],
      '{{phone}}': Array.from(new Set(entries.map(e => e.values[7]).filter(Boolean))).join(', '),
      '{{uf}}': entry[8],
      '{{city}}': entry[9],
      '{{address_identification}}': entry[10],
      '{{direccion}}': entry[13],
      '{{numero}}': entry[14],
      '{{lote}}': entry[15],
      '{{distrito}}': entry[16],
      '{{reference}}': entry[17],
      '{{postal_Code}}': entry[18],
      '{{fecha}}': formattedDate1,
      '{{tracking_yobel}}': entry[41],
      '{{sequence}}': entry[1]
    };
  
    for (var key in replacements) {
      body.replaceText(key, replacements[key]);
    }
  
    var paragraph = body.appendParagraph('');
    paragraph.appendText("ID SKU\tDescripción\t\tPrecio\n");
  
    var total = 0;
    entries.forEach(e => {
      var idSku = e.values[33];
      var descripcion = e.values[36];
      var precio = parseFloat(e.values[39]);
      total += precio;
      paragraph.appendText(idSku + "\t" + descripcion + "\n" + "\t\t\t\t\tPrecio: " + precio.toFixed(2) + "\n");
    });
  
    paragraph.appendText("Total:\t" + total.toFixed(2));
  
    var placeholders = {
      '{{QRCODE}}': qrImageCache[orden],
      '{{BARCODE}}': barcodeImageCache[orden],
      '{{IMAGEN_URL}}': logoImage
    };
  
    for (var placeholder in placeholders) {
      var element = body.findText(placeholder);
      if (element) {
        var el = element.getElement();
        el.asText().setText("");
        var inlineImage = el.getParent().asParagraph().insertInlineImage(0, placeholders[placeholder]);
        if (placeholder === '{{QRCODE}}') {
          inlineImage.setWidth(70);
          inlineImage.setHeight(70);
        } else if (placeholder === '{{BARCODE}}') {
          inlineImage.setWidth(310);
          inlineImage.setHeight(60);
        } else if (placeholder === '{{IMAGEN_URL}}') {
          inlineImage.setWidth(imageWidth);
          inlineImage.setHeight(imageHeight);
        }
      }
    }
  
    doc.saveAndClose();
  
    var pdf = copiaTemplate.getAs('application/pdf');
    var pdfFile = folder.createFile(pdf).setName('Voucher_' + orden + '.pdf');
    var pdfUrl = pdfFile.getUrl();
    updateSheet(entries[0].row, pdfUrl);
  
    sendEmail(client_Name, client_Last_Name, email, orden, formattedDate1, formattedDate2, entry[41], pdfFile);
    DriveApp.getFileById(copiaTemplate.getId()).setTrashed(true);
  }
  
  function updateSheet(row, url) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.getRange(row, 41).setValue(url);
  }
  
  function sendEmail(client_Name, client_Last_Name, email, orden, formattedDate1, formattedDate2, tracking_yobel, pdfFile) {
    var htmlTemplate = HtmlService.createTemplateFromFile('EmailTemplate');
    htmlTemplate.client_Name = client_Name;
    htmlTemplate.client_Last_Name = client_Last_Name;
    htmlTemplate.orden = orden;
    htmlTemplate.formattedDate1 = formattedDate1;
    htmlTemplate.formattedDate2 = formattedDate2;
    htmlTemplate.tracking_yobel = tracking_yobel;
    var htmlBody = htmlTemplate.evaluate().getContent();
  
    MailApp.sendEmail({
      to: email,
      subject: 'Tu Voucher',
      htmlBody: htmlBody,
      attachments: [pdfFile]
    });
  }
  
  function onOpen() {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Voucher')
      .addItem('Generar Vouchers', 'enviarVouchers')
      .addToUi();
  }
  