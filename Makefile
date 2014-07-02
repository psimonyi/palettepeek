# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

locale := locale/en-CA/palettepeek.properties
content := main.js style.css $(locale)
icons := icon16.png icon32.png icon48.png icon64.png

palettepeek.xpi: install.rdf chrome.manifest bootstrap.js $(content) $(icons)
	-rm -f -- $@
	zip -0 --quiet $@ $^

icon%.png: palettepeek.svg
	inkscape --export-png=$@ --export-width=$* --file=$<


.PHONY: clean
clean:
	-rm -f -- palettepeek.xpi $(icons)

# This is for Extension Auto-Installer.
.PHONY: test
test: palettepeek.xpi
	curl --http1.0 --max-time 1 --upload-file $< http://localhost:8888/

