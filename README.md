# Drill4J Auto Testing Browser Extension

## Development

## Production build

1. `npm install`
2. Update the `version` field in the `src/manifest.json`
3. Build with `npx webpack`
4. Build and package
    - Chrome utilizes CRXv3 format to package extensions. First, build the extension files, second - pack `build` folder with the Chrome executable.
    - As we are not currently publishing the extension to the **Google Chrome Web Store** keeping `.pem` keyfile is not important. In case if we do decide to publish the extension, **saving the `build.pem` file will be crucial**. It is best to add it to Drill4J org GitHub secrets.
    - Windows 10 example:

    ```shell
    npx webpack && rm -f build.crx && rm -f build.pem && "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --pack-extension="$PWD/build"
    ```
