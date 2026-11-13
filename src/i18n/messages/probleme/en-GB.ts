import type { ProblemeCatalog } from "./ro";

/** British English. */
export const enGBProbleme: ProblemeCatalog = {
  "Problem": {
    "metaTitle": "Report a problem",
    "label": "Help",
    "title": "Something not working as it should?",
    "lead": "Tell us briefly what happened. If you can, add a picture of your screen: it shows us exactly what you see. We note the page you came from ourselves.",
    "kindLabel": "What is it about?",
    "kinds": {
      "eroare": "Something doesn’t work (an error)",
      "arbore": "Wrong links in the tree (who is whose parent, sibling or spouse)",
      "idee": "An idea or a wish",
      "altceva": "Something else"
    },
    "message": "Tell us what happened",
    "messagePlaceholder": "For example: “I pressed Save on Grandad John and nothing happened.” or “Mary shows as a sister, but she’s a cousin.”",
    "images": "Pictures of your screen (up to 3, optional)",
    "imagesHelp": "On a phone, take a screenshot (usually by holding the power and volume-down buttons together) and choose it here. On a computer: Windows + Shift + S, on a Mac Cmd + Shift + 4.",
    "addImages": "Choose pictures",
    "remove": "Remove",
    "pageNote": "You came from the page: {page}",
    "privacyNote": "Only we see your message and pictures, to fix the problem. If they show family details, we use them for nothing else. More in the <privacy>Privacy policy</privacy>.",
    "send": "Send",
    "sending": "Sending…",
    "sent": "Thank you! We’ve received your message and will look at it as soon as we can. Our reply will appear below, on this page.",
    "another": "Write something else",
    "errors": {
      "message": "Please write a few words about the problem.",
      "tooLong": "The message is too long. Please make it a bit shorter.",
      "tooMany": "You’ve sent many messages today. Please try again tomorrow or message us on WhatsApp.",
      "tooManyImages": "You can add up to 3 pictures.",
      "tooBig": "The pictures are too large. Choose fewer.",
      "imageType": "Only pictures work (JPG, PNG or WebP).",
      "storageOff": "Pictures can’t be uploaded right now. Please send just the text.",
      "failed": "Sending didn’t work. Please try again shortly.",
      "signIn": "Sign in to write to us from here.",
      "demo": "The example account can’t send messages. Please sign in to your own account."
    },
    "mineTitle": "What you’ve written to us",
    "mineEmpty": "You haven’t written to us from here yet.",
    "status": {
      "nou": "Received",
      "vazut": "We’re looking into it",
      "rezolvat": "Solved"
    },
    "sentOn": "Sent on {date}",
    "ourReply": "Our reply",
    "newReply": "new",
    "noReply": "We haven’t replied yet.",
    "mailSubject": "We’ve replied to the problem you reported",
    "mailBody": "Hello {name}! We’ve replied to the message you sent from “Report a problem”:",
    "mailLink": "You can also see it here: {link}"
  }
};
