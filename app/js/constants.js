GL.constant("CONSTANTS", {
   /* The email regexp restricts email addresses to less than 400 chars. See #1215 */
   "email_regexp": /^([\w+-.]){0,100}[\w]{1,100}@([\w+-.]){0,100}[\w]{1,100}$/,
   "number_regexp": /^\d+$/,
   "phonenumber_regexp": /^[+]?[ \d]+$/,
   "hostname_regexp": /^[a-z0-9-.]+$|^$/,
   "https_regexp": /^https:\/\/([a-z0-9-]+)\.(.*)$|^$/,
   "uuid_regexp": /^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/
});
