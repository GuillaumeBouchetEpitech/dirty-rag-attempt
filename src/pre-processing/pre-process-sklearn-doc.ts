

import * as fs from "fs"
import * as path from "path"
import * as url from "url"
import * as cheerio from "cheerio"

import TurndownService from 'turndown'

//
//
//

const rootFolder = path.join(__dirname, '..', "..", "my-docs");
const jsonListFilepath = path.join(rootFolder, "sklearn.list.json");
const downloadPath = path.join(rootFolder, "raw-download");
const preProcessedPath = path.join(rootFolder, "pre-processed");

const rawBaseUrl = 'https://scikit-learn.org/stable/modules/generated/';

//
//
//

const baseUrl = new url.URL(rawBaseUrl);

const _downloadOne = async (filename: string) => {

  // console.log('_downloadOne.filename', filename);

  const destPath = path.join(downloadPath, filename);

  const stat = fs.statSync(destPath, {throwIfNoEntry: false})
  if (stat) {
    // console.log('_downloadOne.alreadyDone');
    return false;
  }

  const tmpUrl = new url.URL(baseUrl.href);

  // console.log('_downloadOne.tmpUrl.pathname', tmpUrl.pathname);
  // console.log('_downloadOne.tmpUrl.href', tmpUrl.href);

  tmpUrl.pathname = path.join(tmpUrl.pathname, filename);

  // console.log('_downloadOne.tmpUrl.href', tmpUrl.href);

  const response = await fetch(tmpUrl);
  const rawText = await  response.text();

  // console.log('_downloadOne.rawText', rawText.length);

  fs.writeFileSync(destPath, rawText, 'utf8');

  // console.log('_downloadOne.done');

  return true;
};

//
//
//

const _preProcessOne = (filename: string) => {

  // console.log('_preProcessOne.filename', filename);

  const partialFilename = filename.substring(0, filename.length - path.extname(filename).length);

  // console.log('_preProcessOne.partialFilename', partialFilename);

  const newFilename = `${partialFilename}.txt`;

  // console.log('_preProcessOne.newFilename', newFilename);

  const destPath = path.join(preProcessedPath, newFilename);

  const stat = fs.statSync(destPath, {throwIfNoEntry: false})
  if (stat) {
    // console.log('_preProcessOne.alreadyDone');
    return false;
  }

  const srcPath = path.join(downloadPath, filename);

  const htmlContent = fs.readFileSync(srcPath, 'utf8');

  // console.log('_preProcessOne.htmlContent', htmlContent.length);

  const root = cheerio.load(htmlContent);

  root('head').text(''); // noisy
  root('header').text(''); // noisy
  root('#pst-primary-sidebar').text(''); // noisy
  root('#pst-secondary-sidebar').text(''); // noisy
  root('#pst-skip-link').text(''); // noisy
  root('#pst-back-to-top').text(''); // noisy
  root('.bd-search').text(''); // noisy

  const rawHtml = root.html({})

  const turndownService = new TurndownService();
  const cleanedUpText = turndownService.turndown(rawHtml);

  // const cleanedUpText = rawHtml
  //   .split('\n')
  //   .map(line => line.replace(/<\/?[a-zA-Z0-9=\-_\.\?\/"'#:\(\)%! ]*>/g, ' '))
  //   .map(line => line.replace(/\s\s+/g, ' '))
  //   // .map(line => line.replace(/<\/?[a-zA-Z0-9=\-_\.\?\/"'#:\(\)%! ]*>/g, ' '))
  //   .filter(line => line.trim().length > 0)
  //   .join('\n')
  //   // .map(line => line.replace(/<\/?[a-zA-Z0-9=" ]*>/g, ' '))
  //   // .replaceAll(/<\/?[a-zA-Z0-9=" ]*>/g, ' ').replace(/\s\s+/g, ' ').trim())

  // // const cleanedUpText = root.text()
  // //   .split('\n')
  // //   // only remove empty lines
  // //   .filter(line => line.trim().length > 0)
  // //   .join('\n')

  // // console.log('_preProcessOne.cleanedUpText', cleanedUpText.length);

  fs.writeFileSync(destPath, cleanedUpText, 'utf8');

  // console.log('_preProcessOne.done');

  return true;
};

//
//
//

export const preprocessSkLearnDoc = async (): Promise<{ filepath: string; content: string; }[]> => {

  const rawText = fs.readFileSync(jsonListFilepath, 'utf8');
  const links = JSON.parse(rawText);

  fs.mkdirSync(downloadPath, { recursive: true }); // ensure folder
  fs.mkdirSync(preProcessedPath, { recursive: true }); // ensure folder

  let totalDownload = 0;
  let totalProcessed = 0;

  for (let ii = 0; ii < links.length; ++ii) {

    const currLink = links[ii]

    process.stdout.write(`\r -> processing link: ${ii} / ${links.length}`);

    const wasDownloaded = await _downloadOne(currLink);
    const wasProcessed = _preProcessOne(currLink);

    if (wasDownloaded) {
      totalDownload += 1;
    }
    if (wasProcessed) {
      totalProcessed += 1;
    }
  }

  process.stdout.write(`\n`);
  console.log(` ---> total downloaded: ${totalDownload} / ${links.length} (done once, then cached)`);
  console.log(` ---> total processed: ${totalProcessed} / ${links.length} (done once, then cached)`);

  const allFiles: { filepath: string; content: string; }[] = [];

  const folderEntries = fs.readdirSync(preProcessedPath, {withFileTypes: true});
  for (const currEntry of folderEntries) {

    if (!currEntry.isFile()) {
      continue;
    }

    const filepath = path.join(preProcessedPath, currEntry.name);

    const content = fs.readFileSync(filepath, 'utf8');

    allFiles.push({ filepath, content });
  }

  return allFiles;
};


