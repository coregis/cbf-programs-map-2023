# cbf-programs-map-2023
Rebranding and other updates to the Raise Your Hand Texas Programs Map

## Local testing

Google sheets CORS rules seem to have started blocking requests from `file://` URLs.  So to preview this on our local machines we need to run a server.  An easy way to do that is:

Open a command line window, go to this folder, type `python -m SimpleHTTPServer 2023` (for Python 2) or `python -m http.server 2023` (for Python 3) or `python3 -m http.server 2023` (to explicitly select Python3 in an environment that also has Python 2 installed), and leave that session running.

Then the page should be available at http://localhost:2023/ (you can change the number in the python command to also change it in the localhost URL).

## Pointers for data updates

### Date range

The min and max years for the time slider are set in the `<input id='slider'>` declaration in `index.html` itself.

Years outside that range can in fact be selected using the `year=xxxx` URL argument, but the user won't be able to go back to those after interacting with the time slider, so this is only occasionally useful for testing.
