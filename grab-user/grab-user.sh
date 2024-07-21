#!/bin/bash
#
# This script grabs all user data from an SE website, parses the relevant
# data and writes those profiles to an HTML file, which contains at least
# a description or a website.
# Note: Due to the large number of users, the first run should be used with
# the -n parameter, as the number of entries would otherwise result in a
# very large HTML file.
#
# Requirements: curl, html-xml-utils, html2text, recode
#

# User-defined variables (overwrite in config file if required)
pathData="userdata/"
pathOutput="output/"
badRegex="owner name|business name|business email|business phone|\bphone[\s]?:|\bcrack\b|\bsitus\b|casino|keywords|\bfax|monday[\s]?-[\s]?friday|description[\s]?:|\brestoration\b|\bescort\b"
url="blender.stackexchange.com"
htmlFile="index.html"

# Can be overwritten by command line parameters
startId=1
endId=0
forceDownload=0
createHtml=1
quiet=0

# Pre-defined variables (do NOT overwrite or if you don't know what you are doing here)
usersNotFoundList="grab-user.404"
profileUrlUser="users/%s/?tab=profile"
profileUrlOverview="users?tab=NewUsers&sort=creationdate"
imgSelector="d-none sm:d-block js-usermini-avatar-container"
cooldown404=12 # Do NOT change to lower values!

# Do NOT touch these!
cmdCurl=""
cmdHxclean=""
cmdHxselect=""
cmdHxremove=""
cmdHtml2text=""
cmdRecode=""
pathScript=""

#-------------------------------------------------------------------------------
# Show usage information
#	$?	void
#-------------------------------------------------------------------------------
function ShowUsage() {
    echo "
	Usage: grab-user.sh [OPTIONS]

	  -h             Display this information
	  -s             Start ID (If no value is specified, the last saved value is used, see configuration file)
	  -e             End ID (If no value is specified, the highest ID is determined automatically)
	  -f             Force download of userdata (will overwrite exsting data!)
	  -n             Do not create HTML files (download userdata only)
	  -q             Quiet

	Example: grab-user.sh -s 180000 -e 190000
	"
}

#-------------------------------------------------------------------------------
# Output colored message
#	$1	int	    The color
#	$2	string	The colored part of the message
#	$3	string	The final message
#	$?	void
#-------------------------------------------------------------------------------
function EchoColoredMessage() {
    echo "$(tput bold)$(tput setaf ${1})${2}$(tput sgr0)${3}"
}

#-------------------------------------------------------------------------------
# Show error-message and exit with code 1
#	$3	string	The message
#	$?	void
#-------------------------------------------------------------------------------
function ExitOnError() {
    EchoColoredMessage 1 "❱ EXIT:" " ${1}"
    exit 1
}

#-------------------------------------------------------------------------------
# Check if a required argument is empty
#	$1	string	The argument name
#	$2	string	The value of the argument
#	$?	void
#-------------------------------------------------------------------------------
function CheckArgument() {
    [[ ${2} =~ ^-.* ]] && ExitOnError "No value for argument $(tput bold)${1}$(tput sgr0)"
}

#-------------------------------------------------------------------------------
# Check package requirements
#	$?	void
#-------------------------------------------------------------------------------
function CheckRequirements() {
    cmdCurl=$(which "curl")
    if [[ -z "${cmdCurl}" ]]; then
        ExitOnError "The 'curl' command is missing or not available. Please install with: apt install curl"
        exit 1
    fi
    cmdHxclean=$(which "hxclean")
    if [[ -z "${cmdHxclean}" ]]; then
        ExitOnError "The 'hxclean' command is missing or not available. Please install with: apt install html-xml-utils"
        exit 1
    fi
    cmdHxselect=$(which "hxselect")
    if [[ -z "${cmdHxselect}" ]]; then
        ExitOnError "The 'hxselect' command is missing or not available. Please install with: apt install html-xml-utils"
        exit 1
    fi
    cmdHxremove=$(which "hxremove")
    if [[ -z "${cmdHxremove}" ]]; then
        ExitOnError "The 'hxremove' command is missing or not available. Please install with: apt install html-xml-utils"
        exit 1
    fi
    cmdHtml2text=$(which "html2text")
    if [[ -z "${cmdHtml2text}" ]]; then
        ExitOnError "The 'html2text' command is missing or not available. Please install with: apt install html2text"
        exit 1
    fi
    cmdRecode=$(which "recode")
    if [[ -z "${cmdRecode}" ]]; then
        ExitOnError "The 'recode' command is missing or not available. Please install with: apt install recode"
        exit 1
    fi
}

#-------------------------------------------------------------------------------
# Load configuration file
#	$?	void
#-------------------------------------------------------------------------------
function LoadConfig() {
    # Include config file
    configFile="${pathScript}grab-user.conf"
    [ -f ${configFile} ] && . ${configFile} || ExitOnError "Config file $(tput bold)${configFile}$(tput sgr0) could not be loaded!"
}

#-------------------------------------------------------------------------------
# Modify value in configuration file
#	$1	string	parameter
#	$2	string	value
#	$?	void
#-------------------------------------------------------------------------------
function UpdateConfValue() {
    local operator="="
    local parameter="${1}"
    local value="${2}"
    grep -P -q "^${parameter}\b.*$" ${configFile} && sed -i -e "s/^\(${parameter}\b[\t ${operator}]*\).*$/\1${value}/" ${configFile} || echo "${parameter}${operator}${value}" >>${configFile}
}

#-------------------------------------------------------------------------------
# Determine the highest user ID from the current users list
#	$?	void
#-------------------------------------------------------------------------------
function GetHighestUserId() {
    local response=$(${cmdCurl} -L -s -w "\n%{http_code}" ${profileUrlOverview})
    local http_code=$(tail -n1 <<<"${response}")
    if [[ ${http_code} == "200" ]]; then
        endId=$(sed '$ d' <<<"${response}" | ${cmdHxclean} | ${cmdHxselect} -c div[id='user-browser'] div.user-info:first-child div:first-child | sed -n 's/.*href="\/users\/\([^\/]*\).*/\1/p')
        [[ -z ${endId} ]] && ExitOnError "User ID could not be parsed!"
    else
        ExitOnError "User ID could not be retrieved from $(tput bold)${profileUrlOverview}$(tput sgr0)!"
    fi
}

#-------------------------------------------------------------------------------
# Prepare required variables
#	$?	void
#-------------------------------------------------------------------------------
function PrepareVariables() {
    url="https://${url}/"
    profileUrlUser="${url}${profileUrlUser}"
    profileUrlOverview="${url}${profileUrlOverview}"
    [[ ${endId} -eq 0 ]] && GetHighestUserId
    if [[ -n "${pathOutput}" ]]; then
        if [[ $pathOutput =~ ^"/" ]]; then
            pathOutput="$(realpath -m ${pathOutput})/"
        else
            pathOutput="$(realpath -m ${pathScript}${pathOutput})/"
        fi
    else
        pathOutput="${pathScript}"
    fi
    htmlFile="${pathOutput}${htmlFile}"
    pathData="${pathScript}${pathData}"
    usersNotFoundList="${pathScript}${usersNotFoundList}"
}

#-------------------------------------------------------------------------------
# Show variables and ask for user input to proceed
#	$?	void
#-------------------------------------------------------------------------------
function AskForUserInput() {
    echo ""
    EchoColoredMessage 3 "URL: " "$(tput bold)${url}$(tput sgr0)"
    EchoColoredMessage 3 "Start ID: " "$(tput bold)${startId}$(tput sgr0)"
    EchoColoredMessage 3 "End ID: " "$(tput bold)${endId}$(tput sgr0)"
    EchoColoredMessage 3 "Force Download: " "$(tput bold)${forceDownload}$(tput sgr0)"
    EchoColoredMessage 3 "Create HTML: " "$(tput bold)${createHtml}$(tput sgr0)"
    EchoColoredMessage 3 "Output path: " "$(tput bold)${pathOutput}$(tput sgr0)"
    EchoColoredMessage 3 "User data path: " "$(tput bold)${pathData}$(tput sgr0)"
    echo ""

    echo "$(tput bold)Do you want download the userdata?$(tput sgr0)"
    read -p "[y/N] " action
    if [[ ${action} ]] && [ ${action} == "j" -o ${action} == "J" -o ${action} == "y" -o ${action} == "Y" ]; then
        echo ""
    else
        ExitOnError "Aborted by user input!"
    fi
}

#-------------------------------------------------------------------------------
# Prepare paths & files
#	$?	void
#-------------------------------------------------------------------------------
function PreparePaths() {
    [[ ! -d "${pathData}" ]] && mkdir -p "${pathData}"
    [[ ! -d "${pathOutput}" ]] && mkdir -p "${pathOutput}"
    [[ ! -f "${usersNotFoundList}" ]] && touch "${usersNotFoundList}"
    cp -fp "${pathScript}grab-user.css" "${pathOutput}index.css"
}

#-------------------------------------------------------------------------------
# Remove user data if the profile was previously downloaded
#	$?	void
#-------------------------------------------------------------------------------
function RemoveUserdata() {
    [[ -f ${userDataFile} ]] && rm ${userDataFile}
}

#-------------------------------------------------------------------------------
# Download user data
#	$1	string	The user ID
#	$2	string	The user data file
#	$?	void
#-------------------------------------------------------------------------------
function DownloadUserdata() {
    local userId=${1}
    local userDataFile=${2}

    if [[ -z $(grep -i "\b${userId}\b" "${usersNotFoundList}") ]]; then
        if [[ ! -f ${userDataFile} ]] || [[ ${forceDownload} -eq 1 ]]; then
            local url=$(echo ${profileUrlUser} | sed "s/%s/${userId}/")

            response=$(${cmdCurl} -L -s -w "\n%{http_code}" ${url})
            http_code=$(tail -n1 <<<"${response}")

            if [[ ${http_code} == "429" ]]; then
                # Cool down & repeat
                [[ ${quiet} -eq 0 ]] && EchoColoredMessage 6 "[${http_code}]" " Too many requests (additional cool down for ${cooldown404}s)"
                sleep ${cooldown404}
                response=$(${cmdCurl} -L -s -w "\n%{http_code}" ${url})
                http_code=$(tail -n1 <<<"${response}")
                if [[ ${http_code} == "429" ]]; then
                    # Cool down & repeat
                    [[ ${quiet} -eq 0 ]] && EchoColoredMessage 6 "[${http_code}]" " Too many requests (extended cool down for 300s)"
                    sleep 300
                    response=$(${cmdCurl} -L -s -w "\n%{http_code}" ${url})
                    http_code=$(tail -n1 <<<"${response}")
                fi
            fi

            if [[ ${http_code} == "200" ]] || [[ ${http_code} == "301" ]] || [[ ${http_code} == "302" ]]; then
                [[ ${quiet} -eq 0 ]] && EchoColoredMessage 2 "[${http_code}]" " ❱ Received data for user $(tput bold)${userId}$(tput sgr0) from '${url}'"
                # Get all but the last line (which contains the status code)
                content=$(sed '$ d' <<<"${response}")
                # Extract relevant section to file:
                echo "${content}" | ${cmdHxclean} | ${cmdHxselect} -c -s "\n" "div[id='mainbar-full']" | ${cmdHxremove} svg,script | hxclean | sed 's/^[[:space:]]*//g' >${userDataFile}
                randomMicroSeconds=$(printf "%03d\n" $(shuf -i 500-999 -n 1))
                sleep 0.${randomMicroSeconds}
            elif [[ ${http_code} == "404" ]]; then
                randomMicroSeconds=$(printf "%03d\n" $(shuf -i 0-999 -n 1))
                [[ ${quiet} -eq 0 ]] && EchoColoredMessage 1 "[${http_code}]" " User $(tput bold)${userId}$(tput sgr0) does not exist. (cool down: ${cooldown404}.${randomMicroSeconds}s)"
                RemoveUserdata "${userDataFile}"
                echo "${userId}" >>"${usersNotFoundList}"
                sleep ${cooldown404}.${randomMicroSeconds}
            else
                [[ ${quiet} -eq 0 ]] && EchoColoredMessage 1 "[${http_code}]" " ...giving up for user $(tput bold)${userId}$(tput sgr0)!"
                echo "${userId}" >>grab-user.error
                sleep 2
            fi
        else
            [[ ${quiet} -eq 0 ]] && echo "Data for user $(tput bold)${userId}$(tput sgr0) has already been downloaded"
        fi
    else
        [[ ${quiet} -eq 0 ]] && echo "User $(tput bold)${userId}$(tput sgr0) does not exist"
        RemoveUserdata "${userDataFile}"
    fi
}

#-------------------------------------------------------------------------------
# Create HTML file
#	$?	void
#-------------------------------------------------------------------------------
function AddHtmlHeader() {
    if [[ ${createHtml} -eq 1 ]]; then
        fileName="${1}"
        [[ ${quiet} -eq 0 ]] && echo "Create file '${fileName}'"
        # Open html/body
        echo "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=viewport content=\"width=device-width,initial-scale=1\"><link rel=\"stylesheet\" href=\"index.css\"></head><body>" >${fileName}
        echo "<h1>${date}</h1>" >>${fileName}
        # Open list
        echo "<ul class=\"users\">" >>${fileName}
    fi
}

#-------------------------------------------------------------------------------
# Close HTML file
#	$?	void
#-------------------------------------------------------------------------------
function AddHtmlFooter() {
    if [[ ${createHtml} -eq 1 ]]; then
        fileName="${1}"
        # Close list
        echo "</ul>" >>${fileName}
        # Close body/html
        echo "</body></html>" >>${fileName}
    fi
}

#-------------------------------------------------------------------------------
# Add user data to HTML
#	$1	string	The user ID
#	$2	string	The user data file
#	$?	void
#-------------------------------------------------------------------------------
function AddUserDataToHtml() {
    local userId="${1}"
    local userDataFile="${2}"

    if [[ ${createHtml} -eq 1 ]] && [[ -f ${userDataFile} ]]; then

        location=$(cat ${userDataFile} | ${cmdHxselect} -c "ul.s-anchors:nth-of-type(2) li:nth-last-child(1) div.truncate" | tail -n +2 | ${cmdRecode} html..UTF-8)
        [[ -z ${location} ]] && select=1 || select=2
        website=$(cat ${userDataFile} | ${cmdHxselect} -c "ul.s-anchors:nth-of-type(2) li:nth-last-child(${select}) a[rel*='me']")
        [[ -z ${website} ]] && website=$(cat ${userDataFile} | ${cmdHxselect} -c "ul.s-anchors:nth-of-type(2) li:nth-last-child(2) div:first-child" | ${cmdHtml2text} -utf8)

        description=$(cat ${userDataFile} | ${cmdHxselect} -c div.js-about-me-content | ${cmdHtml2text} -utf8 -style pretty -width 200)

        if [[ -n "${website}" ]] || [[ -n "${description}" ]]; then

            username=$(cat ${userDataFile} | ${cmdHxselect} -c div.fs-headline2 | tail -n +2)

            #memberSince=$(cat ${userDataFile} | ${cmdHxselect} -c "ul.s-anchors:nth-of-type(1) li:first-child > div:first-child > div:nth-of-type(2)" | sed -n 's/.*title="\([^"]*\).*/\1/p')
            #lastSeen=$(cat ${userDataFile} | ${cmdHxselect} -c "ul.s-anchors:nth-of-type(1) li:last-child > div div:last-child" | tail -n 1)

            image=$(cat ${userDataFile} | ${cmdHxselect} -c "div[class='${imgSelector}']" | sed -n 's/.*src="\([^"]*\)".*/\1/p')
            imageSource=$(cat ${userDataFile} | ${cmdHxselect} -c "div[class='${imgSelector}']" | sed -n 's/.*src="https:\/\/\([^\/]*\).*/\1/p')

            if [[ ${imageSource} == *"gravatar"* ]]; then
                imageSource="gravatar"
            elif [[ ${imageSource} == *"static"* ]]; then
                imageSource="SE"
            elif [[ ${imageSource} == *"facebook"* ]]; then
                imageSource="facebook"
            elif [[ ${imageSource} == *"google"* ]]; then
                imageSource="google"
            fi

            imageTag="<div><img src=\"${image}\"/>${imageSource}</div>"
            class=""
            warning=""
            spam=0

            spamCheck=$(echo "${description}" | grep -E -w -i "${badRegex}")
            [[ $? = 0 ]] && spam=1
            spamCheck=$(echo "${username}" | grep -E -w -i "\bspam\b|\bspammer\b")
            [[ $? = 0 ]] && spam=1

            if [[ ${spam} -eq 1 ]]; then
                class=" class=\"warning\""
                warning="<span>[WARNING]</span>"
            fi

            echo "<li${class}>
${imageTag}
<div>${warning}
<h2>#${userId} <a href=\"${url}users/${userId}\">${username}</a><a href=\"${url}users/edit/${userId}\">[Edit]</a></h2>
<span>${location}</span>
<span>${website}</span>
<pre>${description}</pre>
</div>
</li>" >>${htmlFile}

        fi
    fi
}

#-------------------------------------------------------------------------------
# Main process
#	$?	void
#-------------------------------------------------------------------------------
function Process() {
    [[ ${startId} -eq ${endId} ]] && ExitOnError "Start and end have the same ID."
    AddHtmlHeader "${htmlFile}"
    lastProcessedId=1
    for userId in $(seq ${startId} ${endId}); do
        userDataFile="${pathData}user-${userId}.html"
        DownloadUserdata ${userId} "${userDataFile}"
        AddUserDataToHtml ${userId} "${userDataFile}"
        lastProcessedId=${userId}
    done
    # Add the last processed ID to the configuration file and use it as start ID for the next run
    UpdateConfValue "startId" ${lastProcessedId}
    AddHtmlFooter "${htmlFile}"
}

#-------------------------------------------------------------------------------

CheckRequirements

pathScript="$(dirname "$(readlink -f "${0}")")/"

LoadConfig

# Parse the command line arguments.
while getopts hs:e:fnq option; do
    case "${option}" in
    h)
        ShowUsage
        exit
        ;;
    s)
        CheckArgument "-s" "${OPTARG}"
        startId=(${OPTARG})
        ;;
    e)
        CheckArgument "-e" "${OPTARG}"
        endId=(${OPTARG})
        ;;
    f)
        forceDownload=1
        ;;
    n)
        createHtml=0
        ;;
    q)
        quiet=1
        ;;
    esac
done

PrepareVariables

[[ ${quiet} -eq 0 ]] && AskForUserInput

PreparePaths

Process

exit 0
