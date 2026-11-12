import type { ContactCatalog } from "./ro";

/** British English. */
export const enGBContact: ContactCatalog = {
  "ContactPage": {
    "seller": "The Family Book is provided by {name}, tax ID (CUI) {cui}, Trade Register no. {regCom}, registered office {address}.",
    "printRequest": "Hello! I would like a quote for the printed family book: {pages} pages, {format} format. Hardcover or paperback: … How many copies: … Phone: …",
    "metaTitle": "Contact",
    "metaDescription": "Message us on WhatsApp or send us a note about the Family Book.",
    "menu": "Contact",
    "label": "Contact",
    "title": "Something to tell us?",
    "lead": "A question, an idea or something that isn’t working as it should: message us on WhatsApp or send us a note from here. We reply as soon as we can.",
    "waTitle": "On WhatsApp",
    "waText": "The quickest way: open the chat and write to us directly.",
    "waCta": "Message us on WhatsApp",
    "waGreeting": "Hello! I’m writing from the Family Book website.",
    "waFloat": "Message us on WhatsApp",
    "mailTitle": "By email",
    "mailText": "Leave us your email address so we can reply."
  },
  "Contact": {
    "name": "Your name",
    "email": "Your email address",
    "message": "Message",
    "messagePlaceholder": "Write what you’d like to tell us…",
    "send": "Send message",
    "sending": "Sending…",
    "sent": "Thank you! Your message is on its way and we’ll reply by email.",
    "another": "Send another message",
    "errors": {
      "name": "Please write your name.",
      "email": "That email address doesn’t look right. Please check it.",
      "message": "Please write a few words in your message.",
      "tooMany": "You’ve already sent several messages. Please try again in an hour or message us on WhatsApp.",
      "failed": "Your message couldn’t be sent just now. Please try again shortly or message us on WhatsApp."
    }
  }
};
