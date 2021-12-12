exports.receiver = function() {
  this.viewMostRecentSubmission = async function() {
    await element(by.id("tip-0")).click();
  };

  this.addPublicKey = async function(pgp_key_path) {
    await browser.setLocation("/recipient/preferences");

    if (browser.gl.utils.testFileUpload()) {
      await element(by.xpath("//input[@type='file']")).sendKeys(pgp_key_path);
    } else {
      var fs = require("fs");
      var pgp_key = fs.readFileSync(pgp_key_path, {encoding: "utf8", flag: "r"});
      var pgpTxtArea = element(by.model("resources.preferences.pgp_key_public"));
      await pgpTxtArea.clear();
      await pgpTxtArea.sendKeys(pgp_key);
    }

    await element.all(by.cssContainingText("span", "Save")).first().click();
  };

  this.wbfile_widget = function() {
    return element(by.css("#TipPageWBFileUpload"));
  };

  this.uploadWBFile = async function(fname) {
    await element(by.xpath("//input[@type='file']")).sendKeys(fname);
  };
};

exports.whistleblower = function() {
  this.performSubmission = async function(uploadFiles) {
    await browser.get("/#/");
    await browser.gl.utils.takeScreenshot("whistleblower/home.png");
    await element(by.id("WhistleblowingButton")).click();
    await browser.gl.utils.waitUntilPresent(by.id("SubmissionForm"));
    await element(by.id("step-0")).element(by.id("step-0-field-0-0-input-0")).sendKeys("title");
    await element(by.id("step-0")).element(by.id("step-0-field-1-0-input-0")).sendKeys("description");

    if (uploadFiles && browser.gl.utils.testFileUpload()) {
      var fileToUpload1 = browser.gl.utils.makeTestFilePath("antani.txt");
      var fileToUpload2 = browser.gl.utils.makeTestFilePath("unknown.filetype");
      await element(by.id("step-0")).element(by.id("step-0-field-2-0")).element(by.xpath("//input[@type='file']")).sendKeys(fileToUpload1);
      await element(by.id("step-0")).element(by.id("step-0-field-2-0")).element(by.xpath("//input[@type='file']")).sendKeys(fileToUpload2);
    }

    await browser.gl.utils.waitUntilClickable(by.id("SubmitButton"));

    await browser.gl.utils.takeScreenshot("whistleblower/submission.png");

    await element(by.id("SubmitButton")).click();

    await browser.gl.utils.waitUntilPresent(by.id("Receipt"));

    await browser.gl.utils.takeScreenshot("whistleblower/receipt.png");

    return await element(by.id("Receipt")).getText();
  };

  this.submitFile = async function(fname) {
    await element(by.xpath("//input[@type='file']")).sendKeys(fname);
  };
};
