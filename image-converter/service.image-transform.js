/** 
  Script to transform images in 250kb Webp files (or less, if they are already smaller than 250kb). 
  Simply load all the images that you want to change in inputFolder,
  (which is './images/originals') and run node service.image-transform.js 
  All the new transformed images will be saved in the output folder which is './images/processed'
*/ 

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// Input/Output folders set up
const inputFolder = './images/originals'
const outputFolder = './images/processed'

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder)
}

// Variables to define quality and size of pictures
const targetWidth = 800
const initialQuality = 100
const maxFileSizeKB = 250

async function processImages() {
  const files = fs.readdirSync(inputFolder)

  for (const file of files) {
    const inputPath = path.join(inputFolder, file)
    const outputPath = path.join(outputFolder, path.parse(file).name + '.webp')

    try {
      // Read the original image dimensions and file size
      const { width: originalWidth } = await sharp(inputPath).metadata()
      const originalStats = fs.statSync(inputPath)
      const originalFileSizeKB = originalStats.size / 1024

      // Case 1: Image is under 250 KB but not at target width -> Resize and convert without quality reduction
      if (originalFileSizeKB <= maxFileSizeKB) {
        if (originalWidth !== targetWidth) {
          console.log(`Resizing ${file} to ${targetWidth}px and converting to WebP at 100% quality - Original Size: ${originalFileSizeKB.toFixed(2)} KB`)
          await sharp(inputPath)
            .resize({ width: targetWidth })
            .webp({ quality: 100 })
            .toFile(outputPath)
        } else {
          console.log(`Converting ${file} to WebP without resizing or quality reduction`)
          await sharp(inputPath)
            .webp({ quality: 100 })
            .toFile(outputPath)
        }
        continue
      }

      // Case 2: Image is over 250 KB -> Resize to target width and try converting to WebP
      console.log(`Resizing ${file} to ${targetWidth}px and converting to WebP - Original Size: ${originalFileSizeKB.toFixed(2)} KB`)
      let quality = initialQuality
      await sharp(inputPath)
        .resize({ width: targetWidth })
        .webp({ quality: quality })
        .toFile(outputPath)

      // Check output size
      let stats = fs.statSync(outputPath)
      let fileSizeInKB = stats.size / 1024

      // Case 3: If still over 250 KB, reduce quality iteratively
      while (fileSizeInKB > maxFileSizeKB && quality > 60) {
        quality -= 2
        console.log(`Adjusting ${file} to quality ${quality} for target size...`)

        await sharp(inputPath)
          .resize({ width: targetWidth })
          .webp({ quality: quality })
          .toFile(outputPath)

        stats = fs.statSync(outputPath)
        fileSizeInKB = stats.size / 1024
      }

      console.log(`Final ${file} - Quality: ${quality}, Size: ${fileSizeInKB.toFixed(2)} KB`)
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message)
      console.log(`Skipping ${file} due to unsupported format or other issue.`)
    }
  }
}

processImages()
