# se-helpers

Various scripts for SE

## grab-user

This bash script generates a list of those users for whom at least a description text or a website link is specified. The output is in HTML format and is used to obtain an overview of the content of the profiles to make it easier to detect profile spam.

### Prerequisites

Before using the scripts, ensure you have the following packages installed:

- `recode`: A utility for converting text from one character set to another.
- `curl`: A tool to transfer data from or to a server.
- `html-xml-utils`: A set of tools for manipulating HTML and XML files.
- `html2text`: A utility to convert HTML documents to plain text.

### Usage

```bash
Usage: grab-user.sh [OPTIONS]

  -h             Display this information
  -s             Start ID (If no value is specified, the last saved value is used, see configuration file)
  -e             End ID (If no value is specified, the highest ID is determined automatically)
  -f             Force download of userdata (will overwrite exsting data!)
  -n             Do not create HTML files (download userdata only)
  -q             Quiet

Example: grab-user.sh -s 180000 -e 190000
```

## edit-user

## destroy-user
