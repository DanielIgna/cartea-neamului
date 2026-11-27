import type { PastrareCatalog } from "./ro";

export const enGBPastrare: PastrareCatalog = {
  "Keep": {
    "title": "Keepsake for your tree",
    "text": "With Keepsake, {price} a year, the whole family can see and listen to everything online: full-size photos, voices, documents and the life film. Nothing new can be added; for that you choose a plan again. Once a year you get an email with a link to the complete archive.",
    "freeArch": "Without Keepsake, the tree (names, dates, links, texts) stays visible, and what you uploaded yourself and the whole tree (GEDCOM) can always be downloaded, free of charge. The original photos stay full size for {years, plural, one {one more year} other {# more years}} after your year ends, then small only; we email you 90, 30 and 7 days before.",
    "free": "Without Keepsake nothing is deleted: the tree (names, dates, links, texts) stays visible, photos uploaded by others are shown small only, and what you uploaded yourself and the whole tree (GEDCOM) can always be downloaded for free.",
    "keptUntil": "You have Keepsake until {date}: the family can see and listen to everything. To add again, choose a plan.",
    "extend": "Another year is added after {date}.",
    "bundleTitle": "Keepsake + the family book as PDF:",
    "bundleText": "one year of Keepsake and the PDF book of the tree you choose, {price} instead of {separate}.",
    "bundleTree": "Tree for the book",
    "name": "Keepsake for your tree, one year",
    "bundleName": "Keepsake + the family book (PDF)",
    "thanks": "Thank you! Keepsake is on for one year.",
    "archiveLink": "My archive",
    "banner": "You have Keepsake until {date}: the family can see and listen to everything, with no new additions.",
    "bannerOffer": "Photos uploaded by others are now shown small only. For the family to see them full size and listen to the voices, Keepsake costs {price} a year.",
    "mailNote": "\n\nIf you no longer want to add things but want the family to keep seeing everything (full-size photos, voices), there is Keepsake: {price} a year.",
    "noticeLead": "New: Keepsake.",
    "notice": "When your paid year ends, you can keep the tree online for just {price} a year. The family can still see it and listen to it; only new additions stop. Without Keepsake nothing is deleted: the tree stays visible, photos uploaded by others are shown smaller, and you can download your own files at any time, for free. We have updated the Terms.",
    "noticeMore": "See Keepsake",
    "noticeOk": "Got it"
  },
  "Archive": {
    "title": "My archive",
    "intro": "Everything you can take with you from The Family Book: each tree as a GEDCOM file (any genealogy program opens it), the family book and the files. What you uploaded yourself can always be downloaded in full, for free.",
    "limited": "In trees without a paid year or Keepsake, photos uploaded by others are shown small only.",
    "gedcom": "Download the tree (GEDCOM)",
    "book": "The family book",
    "files": "Files: {n}",
    "none": "No files here yet.",
    "mine": "uploaded by you",
    "kinds": {
      "photo": "Photo",
      "audio": "Voice",
      "act": "Record",
      "letter": "Letter",
      "other": "Document"
    },
    "memories": "Photos and voices in the Memory chest open from the chest, according to who may see them.",
    "myData": "The rest of your data (account, memories, messages) can be downloaded from",
    "myDataLink": "My data",
    "noTrees": "You are not in any tree yet.",
    "owner": "your tree"
  },
  "ArchiveNote": {
    "liber": "The original photos and scanned documents stay full size until {date}. After that they are kept small only; voices, PDF documents and texts all stay. You can keep them full size with Keepsake ({keep} a year) or with the PDF book ({book}), which keeps them in the sealed archive for {years, plural, one {one year} other {# years}}. You can always download them here, free of charge.",
    "liberSealed": "The originals stay full size online until {date}. Then, because you have the PDF book, they go into the sealed archive, kept until {until}.",
    "sigilat": "The originals are in the sealed archive until {until}. They open full size again, straight away, when you renew your year or take Keepsake. You can always download them, free of charge.",
    "redus": "The photos are now kept small only; voices, PDF documents, names, dates and texts are all here.",
    "delete": "Want to delete everything, archive included? You can do it from",
    "banner": "The original photos in “{tree}” stay full size until {date}.",
    "bookSeal": "With the PDF book, the tree’s originals are also kept after your paid year, in the sealed archive, for {years, plural, one {one year} other {# years}}.",
  },
  "ArchiveMail": {
    "arhivare": {
      "subject": "{app}: the originals in “{tree}” go into the sealed archive on {date}",
      "body": "Hello {name},\n\nThe paid year for the tree “{tree}” has ended, and the time in which the originals stayed full size online is coming to an end. Because you have the family book as a PDF, on {date} (in {days} days) the photos, voices and documents go into the sealed archive: compressed and kept for {years, plural, one {one year} other {# years}} from when you bought the book.\n\nThe tree (names, dates, links, texts) and small photos stay online. When you renew your year or take Keepsake ({keep} a year), everything opens full size again, straight away.\n\nYou can always download everything that is yours, free of charge: {link}\nIf you want to delete everything, you can do it from “My data”.\n\nYou don’t need to do anything else.",
    },
    "reducere": {
      "subject": "{app}: photos in “{tree}” will be kept small only from {date}",
      "body": "Hello {name},\n\nOn {date} (in {days} days) the time in which we keep the original photos and scanned documents of the tree “{tree}” full size comes to an end. After that day they are kept small only. Voices, PDF documents, names, dates and texts all stay.\n\nTo keep the originals, you have three ways:\n• download them now, free of charge: {link}\n• take Keepsake, {keep} a year: the family sees and hears everything online;\n• buy the family book as a PDF, {book}: the originals go into the sealed archive, kept for {years, plural, one {one year} other {# years}}.\n\nIf you want to delete everything, you can do it from “My data”.",
    },
  },
  "KeepMail": {
    "subject": "{app}: your family archive",
    "body": "Hello {name}!\n\nKeepsake for your tree in {app} is on until {date}: the family can see and listen to everything online.\n\nYou can find the complete archive (trees as GEDCOM, photos, voices and documents) here: {link}\nWe recommend downloading it once a year and keeping a copy yourself.\n\nThank you for keeping your family’s story!"
  }
};
