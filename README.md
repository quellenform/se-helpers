# se-helpers

Various scripts and tools for SE moderators.

## grab-user

This bash script generates a list of those users for whom at least a description text or a website link is specified. The output is in HTML format and is used to obtain an overview of the content of the profiles.

The original idea of this script was to visualize the user base and its publicly accessible information more clearly in order to make it easier to recognize profile spam and take direct action.

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

## se-chrome-extension

This Chrome extension adds additional buttons to the user profile that can be used to edit or directly destroy the profile with one click.

There are three different buttons:
- `Edit Profile`: Switches directly to the edit page of the profile
- `Profile Spam`: Replaces the existing field contents with generic data
- `Destroy User`: Destroys the profile with one click

> **Caution**: Editing and destroying profiles takes place without further confirmation!

![Profile Page](docs/images/image1.png?raw=true)

![Edit Profile](docs/images/image2.png?raw=true)

In addition, this Chrome extension contains a selection of pre-canned messages:

![Pre-canned comments](docs/images/pcc.gif?raw=true)
