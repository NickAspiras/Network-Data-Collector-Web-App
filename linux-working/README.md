#  KCCTECH Network Data Collector Web App
#  By: Nick Aspiras

Welcome to the KCCTECH Network Data Collector Web App. Below will be instructions on how to work the web app

### Installation
1. Install the .zip folder to your computer
2. Double click on the node-v16.16.0-x64 file to install Node to your device
3. Double click and open the setup.cmd or setup.sh
    - This will download all the necessary dependencies and libraries for the app to work
    - If prompted, click run as command prompt
4. Located in the downloaded folder are two configurations files: emails_config, and speedtest_config
    - emails_config is a text file to list emails, which you will share the spreadsheets with and send the return email, if that option is selected. In the file, you will enter the emails one by one, having one email be on each line.
        - Example:
            test@example.com
            google@gmail.com
            admin@kcctech.com
    - speedtest_config is a text file that will run the speedtest commands in the command line. When filling out the text file, type the frequency of the tests in minutes on the first line, and the test commands on the following lines
        - Example:
            10
            iperf speedtest1
            iperf speedtest2
5. Double click and open the start.cmd or start.sh
    - This will open your browser to the https://localhost:1771 address, which the web app is running on

### Instructions
- On running the server (start.sh file), the browser will prompt with a webpage
- Here you will fill out the following
    - The runtime of the tests in minutes
    - The refresh rate or frequency of data collecting in seconds
    - The desired url to gather data from
    - (OPTIONAL) A filename for the data, which will default as the length of the test (ex: 2_minute_test)
    - (OPTIONAL) Username, if the webpage you are accessing requires a username
    - (OPTIONAL) Password, if the webpage you are accessing requires a password
    - A checkbox to signify if you would like to share the spreadsheet with the emails in the email config file
    - A checkbox to create graphs with the collection data and send a PDF via email to those who are shared
- On pressing start, the test will commence. The user will be presented three Google Sheets links, one for each spreadsheet that the data is being collected to.
- While the test is running, there are two buttons on the loaded page
    1. A 'New Test' button to start a new test if the current test finishes
    2. A 'Stop' button to stop the test entirely.
        - This will navigate to a page and prompt with two buttons
            1. Clicking 'New Test' will go to the original page to start a new test
            2. Clicking 'Off' will turn off the server


## NOTES / Features Not Included
Below are features that were desired for the web app, but were unable to fulfill due to Google's API Services and the KCCTECH Google Organization settings
- Full Ownership Transfer for the Spreadsheets to a KCCTECH Google Organization Member
- No colored axis titles on charts
- No Gridlines from horizontal axis
    - Unable to change gridlines on either axis
- Unable to add graphs onto Google Doc or add headers to Google Doc or PDF
- Unable to create PDF to save in Drive in landscape viewing
    - Instead, created downloadable link for spreadsheet and charts to users given access in email list in a landscape viewing mode
    - Clicking the link sent in the email will download the PDF to your computer, and is then shareable to anyone.
- No Axis Title appearing on Right Vertical Axis
    
