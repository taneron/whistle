describe("Admin upload custom file", function() {
  it("should upload a file and the file should be available for download and deletion", async function() {
    if (!browser.gl.utils.testFileUpload()) {
      return;
    }

    await browser.setLocation("admin/content");

    await element(by.cssContainingText("ul li a", "Files")).click();

    var customFile = browser.gl.utils.makeTestFilePath("antani.txt");

    await element(by.css("span.file-custom")).element(by.css("input")).sendKeys(customFile);

    await browser.gl.utils.waitUntilPresent(by.cssContainingText("label", "Project name"));

    await element(by.cssContainingText("a", "Files")).click();

    await element(by.id("fileList")).element(by.cssContainingText("span", "Delete")).click();
  });
});
