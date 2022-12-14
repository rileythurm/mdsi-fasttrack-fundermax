/* 11-13-22 notes
 * Changes regarding two sheet quantity fields (sheets-input-...)
 * Rearrange loop in calculateAll for cleanness
 * moved finishPrice into recordObject and expanded into gr and xl
 * Add getSolidOrWood to take input of color number (0085, etc.) and return solid or woodgrain
 * dimensionError now grabs size before it displays so it gives the right dimensions
 * Replaced all getSeries calls to using sheetPrice and sheetSize objects
 * Some resetting functions were called in only one place. Moved those into addEventListener
 * Put back in lines from calculate() setting rivet related variables since these actually inform the screws and tufs
*/

/* 11-11-22 notes
 * Moved add event listener block for size toggles since it will now be specific to each panel profile
 * Added size attribute to tabs in recordObject. 0 = GR, 1 = XL
 * Added sheetSizes and sheetPrices data object
*/

/* 11-10-22 notes
 * Copied over the equitone file and made obvious changes
*/


//TODO add finishes into FINISH wildcards in ids in webflow

window.addEventListener('load', () => {
    accessoryIds = [
        {
            id: 'cf-horiz-rail',
            nounSingular: 'each',
            nounPlural: 'each',
            displayName: g('cf-horiz-rail-display-name').innerText,
            price: parseFloat(g('cf-horiz-rail-price').innerText),
            'CF': true,
            'EF': false,
        },
        {
            id: 'cf-clip',
            nounSingular: 'each',
            nounPlural: 'each',
            displayName: g('cf-clip-display-name').innerText,
            price: parseFloat(g('cf-clip-price').innerText),
            'CF': true,
            'EF': false,
        },
        {
            id: 'alum-hat-ext',
            nounSingular: 'each',
            nounPlural: 'each',
            displayName: g('alum-hat-ext-display-name').innerText,
            price: parseFloat(g('alum-hat-ext-price').innerText),
            'CF': false,
            'EF': true,
        },
        {
            id: 'alum-zee-ext',
            nounSingular: 'each',
            nounPlural: 'each',
            displayName: g('alum-zee-ext-display-name').innerText,
            price: parseFloat(g('alum-zee-ext-price').innerText),
            'CF': false,
            'EF': true,
        },
        {
            id: 'tuf-s-concealed-fastener',
            nounSingular: 'box',
            nounPlural: 'boxes',
            displayName: g('tuf-s-concealed-fastener-display-name').innerText,
            price: parseFloat(g('tuf-s-concealed-fastener-price').innerText),
            'CF': true,
            'EF': false,
        },
        
        // TODO add these ids to the page
        {
            id: '9mm-centralizing-tool',
            nounSingular: 'each',
            nounPlural: 'each',
            displayName: g('9mm-centralizing-tool-display-name').innerText,
            price: parseFloat(g('9mm-centralizing-tool-price').innerText),
            'CF': false,
            'EF': true,
        },
        {
            id: '5.6mm-carbide-drillbit',
            nounSingular: 'each',
            nounPlural: 'each',
            displayName: g('carbide-drillbit-display-name').innerText,
            price: parseFloat(g('carbide-drillbit-price').innerText),
            'CF': false,
            'EF': true,
        },
        {
            id: '9mm-carbide-drillbit',
            nounSingular: 'each',
            nounPlural: 'each',
            displayName: g('carbide-drillbit-display-name').innerText,
            price: parseFloat(g('carbide-drillbit-price').innerText),
            'CF': false,
            'EF': true,
        },
        {
            id: '4.5mm-drillbit',
            nounSingular: 'each',
            nounPlural: 'each',
            displayName: g('carbide-drillbit-display-name').innerText,
            price: parseFloat(g('carbide-drillbit-price').innerText),
            'CF': false,
            'EF': true,
        },
    ];

    for (let i = 1; i <= 3; i++) { // 3 since we don't want to be able to navigate straight to order summary since it is after submit form
        g('checkout-label-' + i).addEventListener('click', (event) => {
            if (formSubmitted) return;
            activeCheckoutPane = i;
            displayCheckoutPane();
        });
    }

    displayCheckoutPane();
    document.querySelector('[data-name="FastTrack-Fundermax-Order"]').addEventListener('submit', formSubmit);

    g('previous-button').addEventListener('click', (event) => {
        if (activeCheckoutPane === 1) return;
        if (formSubmitted) return;
        activeCheckoutPane--;
        displayCheckoutPane();
    });
    g('next-button').addEventListener('click', (event) => {
        if (activeCheckoutPane === maxCheckoutPane) return;
        activeCheckoutPane++;
        displayCheckoutPane();
    });

	
    calculatorTabHTML = g('calculator-FINISH-TAB').outerHTML;
    g('calculator-FINISH-TAB').style.display = "none";

    // get finishes form CMS collection
    let getFinishes = document.getElementsByClassName('finish-data');
    for (let i = 0; i < getFinishes.length; i++) {
        finishes.push(getFinishes[i].innerText);
    }
   
    for (let finIndex = 0; finIndex < finishes.length; finIndex++) {
        let f = finishes[finIndex];
        // add screws to accessory object array
        accessoryIds.push(
            {
                id: `cms-${f}`,
                nounSingular: `box`,
                nounPlural: `boxes`,
                displayName: `Color-Matching Screws ${f}`,
                price: parseFloat(g('screw-rivet-price').innerHTML),
                'CF': false,
                'EF': true,
            }
        );
        // Populate recordObject
        recordObject[f] = {
            visibleTabs: 1,
            // ^this is tied to the fact that in our HTML embed, 
            // the first div is set to display flex and the others are none
            tabs: [],
            screws: 0,
            finishSheetsPrices: {
            	'gr': 0,
            	'xl': 0,
            }
            manualSheetQty: false,
        };
        for (let i = 0; i < maxVisibleTabs; i++) {
            recordObject[f].tabs[i] = {
                "sheetPanelArea": 0,
                "sheetArea": 0,
                "sheetCountEstimate": 0,
                "panelsPerSheet": 0,
                "panelCount": 0,
                "horizOrient": 0, // 0 = false = vertical, 1 = true = horizontal
                "solveForSqft": 0, // 0 = false, 1 = true
                "grainVertical": 0 // 0 = false, 1 = true
                "size": 0 // 0 = GR, 1 = XL
            };
        }
        // Populate html of tabs
        for (let tab = 1; tab <= maxVisibleTabs; tab++) {
            g(`${f}-tab-${tab}`).innerHTML = createTab(f, tab);
            g(`grain-vertical-${f}-${tab}`).style.display = "none";
            g(`grain-horizontal-${f}-${tab}`).style.display = "block";
            if (getSolidOrWood(f) == 'solid') {
                g(`grain-toggle-${f}-${tab}`).style.display = "none";
            }
        }
        
		// TODO update these ids in webflow
        // set click listeners
        g(`${f}-add-tab`).addEventListener('click', (event) => {
            addTab(finIndex);
        });
        g(`${f}-remove-tab`).addEventListener('click', (event) => {
            removeTab(finIndex);
        });
        

        // allow manual changes to sheet count
        g(`gr-sheets-input-${f}`).addEventListener('input', (event) => {
        	enterManualSheetCount(f);
            
        });
        // allow manual changes to sheet count contd.
        g(`xl-sheets-input-${f}`).addEventListener('input', (event) => {
            enterManualSheetCount(f);
        });
    }

    // allow manual changes to accessories
    // the manualChangeToAccessory boolean in this and the next loop is used here to facilitate the behavior of the toggle
    // where if you alter qty manually while applyReccs is true, it sets it to false without 
    // clearing the qty fields. Whereas if it's set to false by clicking on the toggle, the 
    // qty fields get cleared.
    for (let i = 0; i < accessoryIds.length; i++) { // 
        g(`${accessoryIds[i].id}-qty`).addEventListener('input', (event) => {
            g(`${accessoryIds[i].id}-total`).innerText = '$' +
                addCommas(accessoryIds[i].price * getValue(`${accessoryIds[i].id}-qty`));
            manualChangeToAccessory = true;
            if (g('Apply-Recommendations').checked) g('Apply-Recommendations').click();
            updateCart();
        });
    }

    // add listener to apply reccs toggle 
    g('Apply-Recommendations').addEventListener('input', (event) => {
        applyReccs = g('Apply-Recommendations').checked;
        if (!manualChangeToAccessory) {
            // Only clear accessories that are calculated by our script.
            // Leave alone ones that are only altered by the user.
            for (let finIndex = 0; finIndex < finishes.length; finIndex++) {
                let f = finishes[finIndex];
                g(`cms-${f}-qty`).value = "";
                g(`cms-${f}-total`).innerText = "0";
            }
            g(`cf-horiz-rail-qty`).value = "";
            g(`cf-horiz-rail-total`).innerText = "0";
            g(`cf-clip-qty`).value = "";
            g(`cf-clip-total`).innerText = "0";
            g(`alum-hat-ext-qty`).value = "";
            g(`alum-hat-ext-total`).innerText = "0";
            g(`alum-zee-ext-qty`).value = "";
            g(`alum-zee-ext-total`).innerText = "0";
            g(`screw-sleeves-qty`).value = "";
            g(`screw-sleeves-total`).innerText = "0";
            g(`tuf-s-concealed-fastener-qty`).value = "";
            g(`tuf-s-concealed-fastener-total`).innerText = "0";
        }
        manualChangeToAccessory = false;
        calculateAll();
    });
    


    // reset a finish tab when it is exited

    let exitButtons = document.getElementsByClassName('x-quantity-selection');
    for (let i = 0; i < exitButtons.length; i++) {
        let id = exitButtons[i].id.substring(0, 4); // This grabs the four digit finish number
        exitButtons[i].addEventListener('click', (event) => {
            //reset finish tab
            resetCalcTab(f, 1)
    		g(`${f}-tab-1`).style.display = 'flex'; // Keep the first one visible
    		for (let tab = 2; tab <= maxVisibleTabs; tab++) {
        		g(`${f}-tab-${tab}`).style.display = 'none';
        		resetCalcTab(f, tab);
    		}
    		recordObject[f].visibleTabs = 1;
    		g(`gr-sheets-input-${f}`).value = "";
    		g(`xl-sheets-input-${f}`).value = "";
    		
            // reset color-matching-screws fields
            g(`cms-${f}-qty`).value = "";
    		g(`cms-${f}-total`).innerText = "";
    		g(`cms-${f}`).style.display = "none"; // travis will show these, I hide them
    		
            calculateAll();
        });
    }

    // Add listeners to inc/dec input fields
    // By filtering by class 'calculator', we won't call calculateAll()
    // whenever the user alters the sheets-input-${finish} field since
    // it is not in the calculator div
    let calcs = document.getElementsByClassName('calculator');
    for (let i = 0; i < calcs.length; i++) {
        let thisCalc = calcs[i];
        let id = thisCalc.id;
        let pattern = /calculator-([^-]+)-(\d+)/;
        let finish = id.replace(pattern, "$1");
        thisCalc.addEventListener('input', (event) => {
            recordObject[finish].manualSheetQty = false;
            calculateAll();
        });
    }

    // set various listeners to input fields
    let inputs = document.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i].getAttribute('type') == 'number') {
            inputs[i].min = "0";
            inputs[i].pattern = "\\d+";
        }
        // Add listener to horiz/vert extrusion toggles
        if (inputs[i].getAttribute('type') == 'checkbox') {
            if (inputs[i].id.startsWith('Extrusion-Horizontal')) {
                inputs[i].addEventListener('input', (event) => {
                    let id = inputs[i].id;
                    let pattern = /Extrusion-Horizontal-([^-]+)-(\d+)/;
                    let finish = id.replace(pattern, "$1");
                    let tab = id.replace(pattern, "$2");
                    // Flip the X/Y placeholder display and update recordObject
                    if (inputs[i].checked) {
                        g(`perim-edges-header-${finish}-${tab}`).innerText = "X Perimeter Edges";
                        recordObject[finish].tabs[tab - 1].horizOrient = 1;
                    } else {
                        g(`perim-edges-header-${finish}-${tab}`).innerText = "Y Perimeter Edges";
                        recordObject[finish].tabs[tab - 1].horizOrient = 0;
                    }
                    // Hide and show the horizontal/vertical divs
                    g(`toggle-horizontal-${finish}-${tab}`).style.display =
                        g(`toggle-horizontal-${finish}-${tab}`).style.display != "none" ? "none" : "block";
                    g(`toggle-vertical-${finish}-${tab}`).style.display =
                        g(`toggle-horizontal-${finish}-${tab}`).style.display != "none" ? "none" : "block";
                    calculateAll();
                });
                continue;
            }
            // Add listener to grain toggles
            if (inputs[i].id.startsWith('Grain-Direction')) {
                inputs[i].addEventListener('input', (event) => {
                    let id = inputs[i].id;
                    let pattern = /Grain-Direction-([^-]+)-(\d+)/;
                    let finish = id.replace(pattern, "$1");
                    let tab = id.replace(pattern, "$2");
                    recordObject[finish].tabs[tab - 1].grainVertical = inputs[i].checked ? 0 : 1;
                    // Hide and show the horizontal/vertical divs
                    g(`grain-horizontal-${finish}-${tab}`).style.display =
                        g(`grain-horizontal-${finish}-${tab}`).style.display != "none" ? "none" : "block";
                    g(`grain-vertical-${finish}-${tab}`).style.display =
                        g(`grain-horizontal-${finish}-${tab}`).style.display != "none" ? "none" : "block";
                    calculateAll();
                });
                continue;
            }
            
    		// add listener to sheet size toggle GR-XL
    		if (inputs[i].id.startsWith('gr-xl-')) {
    		   inputs[i].addEventListener('input', (event) => {
    		       let id = inputs[i].id;
    		       // add these ids to template
    		       let pattern = /gr-xl-size-toggle-([^-]+)-(\d+)/;
    		       let finish = id.replace(pattern, "$1");
    		       let tab = id.replace(pattern, "$2");
    		       // Set size for this tab
    		       recordObject[finish].tabs[tab - 1].size = inputs[i].checked ? 1 : 0; 
    		       // Hide and show the horizontal/vertical divs on the toggle
    		       g(`toggle-gr-${finish}-${tab}`).style.display =
    		           g(`toggle-gr-${finish}-${tab}`).style.display != "none" ? "none" : "block";
    		       g(`togle-xl-${finish}-${tab}`).style.display =
    		           g(`toggle-xl-${finish}-${tab}`).style.display != "none" ? "none" : "block";
    		           
    		    	// TODO may need to also change a size dimensions display somewhere
    		    	
    		       calculateAll();
    		   });
    		   continue;
    		}

        } else if (inputs[i].name == 'Installation-System') {
            inputs[i].addEventListener('input', (event) => {
                fastenerSystem = inputs[i].value // CF, EF
                calculateAll();
            });
            
        // if user is adjusting the panel count field, we solve for sqft
        } else if (inputs[i].id.startsWith('panel-count')) {
            inputs[i].addEventListener('input', (event) => {
                let pattern = /panel-count-([^-]+)-(\d+)/;
                let id = inputs[i].id;
                if (!pattern.test(id)) return;
                let finish = id.replace(pattern, "$1");
                let tab = id.replace(pattern, "$2");
                recordObject[finish].tabs[tab - 1].solveForSqft = 1;
                calculateAll();
            });
        // the user is adjusting the sqft field, we solve for panel count
        } else if (inputs[i].id.startsWith('sqft')) {
            inputs[i].addEventListener('input', (event) => {
                let pattern = /sqft-([^-]+)-(\d+)/;
                let id = inputs[i].id;
                if (!pattern.test(id)) return;
                let finish = id.replace(pattern, "$1");
                let tab = id.replace(pattern, "$2");
                recordObject[finish].tabs[tab - 1].solveForSqft = 0;
                calculateAll();
            });
        }
    }
});

let applyReccs = false;
let manualChangeToAccessory = false;
let formSubmitted = false;
let fastenerSystem = "EF"; 
let activeCheckoutPane = 1; // 1 = Select Materials, 2 = Select Accessories, 3 = Customer Info, 4 = Summary
let finishes = [];
let globalAccessoriesCount = {};
let accessoryIds = [];
let grandTotal = 0;
const maxVisibleTabs = 5; // this needs to be the same as how many empty divs we have in our calculator embeds
const maxCheckoutPane = 4; // this is tied to how many "steps" are in the order process, starting with Select Materials

// TODO get sizes from CMS collection ?
const sheetSizes = {
	"gr": {
		width: "110",
		height: "51",
	},
	"xl": {
		width: "161",
		height: "73",
	}
}
// TODO get prices from CMS collection ?
const sheetPrices = {
	"solid": {
		"gr": 443,
		"xl": 927
	},
	"woodgrain": {
		"gr": 465,
		"xl": 974
	}
}

const screwPerBox = 500;
const hatExtrusionFeetPer = 10;
const zeeExtrusionFeetPer = 10;
const concealedHorizontalRailFeetPer = 12;
const tufsFastenerPerBox = 500;
let calculatorTabHTML = "";

// This gets populated on window load
// Keys will be a finish representing a finish tab like "LT20" 
// Value is an object with a visibleTabs attr and an array of  
// 5 (maxVisibleTabs) objects with the properties "sheetPanelArea" etc. stored
let recordObject = {};

let fastenerMap = {
    'CF': 'Concealed Fasteners',
    'EF': 'Exposed Fasteners'
}

function getSolidOrWood(id) {
	let woods = ['0803', '0027', '0161', '0932'];
	let solids = ['0085', '0074', '0075', '0070'];
	return woods.includes(id) ? 'woodgrain' : 'solid';
}

function g(id) {
    return document.getElementById(id);
}

function getValue(id) {
    return +document.getElementById(id).value;
}

function enterManualSheetCount(f) {
	recordObject[f].manualSheetQty = true;
	let price = sheetPrices[getSolidOrWood(f)];
    g(`subtotal-${f}`).innerText =
        addCommas(sheetPrices[getSolidOrWood(f)]['gr'] * getValue(`gr-sheets-input-${f}`))
        + 
        addCommas(sheetPrices[getSolidOrWood(f)]['xl'] * getValue(`xl-sheets-input-${f}`));
    recordObject[f].finishSheetsPrices['gr'] =
        sheetPrices[getSolidOrWood(f)]['gr'] * getValue(`gr-sheets-input-${f}`);
    recordObject[f].finishSheetsPrices['xl'] =
        sheetPrices[getSolidOrWood(f)]['xl'] * getValue(`xl-sheets-input-${f}`);
    calculateAll();
}
function displayCheckoutPane() {
    document.getElementsByClassName('checkout-container')[0].scrollTop = 0;

    for (let i = 1; i <= maxCheckoutPane; i++) {
        if (i === activeCheckoutPane) {
            g('checkout-pane-' + i).style.display = 'block';
            g('checkout-label-' + i).className = "progress-step active";
        } else {
            g('checkout-pane-' + i).style.display = 'none';
            g('checkout-label-' + i).className = "progress-step";
        }
    }

    switch (activeCheckoutPane) {
        case 1:
            g('previous-button').style.display = "none";
            g('next-button').style.display = "block";
            g('submit-button').style.display = "none";
            break;
        case 2:
            g('previous-button').style.display = "block";
            g('next-button').style.display = "block";
            g('submit-button').style.display = "none";
            break;
        case 3:
            g('previous-button').style.display = "block";
            g('next-button').style.display = "none";
            g('submit-button').style.display = "block";
            break;
    }
}

function formSubmit() {
    formSubmitted = true;
    for (let i = 1; i <= maxCheckoutPane; i++) {
        if (i === maxCheckoutPane) {
            g('checkout-pane-' + i).style.display = 'block';
            g('checkout-label-' + i).className = "progress-step active";
        } else {
            g('checkout-pane-' + i).style.display = 'none';
            g('checkout-label-' + i).className = "progress-step";
        }
    }

    g('summary-last-name').innerText = g('customer-last-name').value;
    g('summary-first-name').innerText = g('customer-first-name').value;
    g('summary-company').innerText = g('customer-company').value;
    g('summary-phone').innerText = g('customer-phone').value;
    g('summary-title-position').innerText = g('customer-title-position').value;
    g('summary-email').innerText = g('customer-email').value;
    g('summary-address-1').innerText = g('customer-address-1').value;
    g('summary-address-2').innerText = g('customer-address-2').value;
    g('summary-city').innerText = g('customer-city').value;
    g('summary-state').innerText = g('customer-state').value;
    g('summary-zip-code').innerText = g('customer-zip-code').value;

    g('summary-fastener-system').innerText = fastenerMap[fastenerSystem];
    g('summary-grand-total').innerText = addCommas(grandTotal);
}

// tabs are 1 based
function addTab(finIndex) {
    let f = finishes[finIndex];
    if (recordObject[f].visibleTabs == maxVisibleTabs) return;
    recordObject[f].visibleTabs++;
    g(`${f}-tab-${recordObject[f].visibleTabs}`).style.display = "flex";
}
function removeTab(finIndex) {
    let f = finishes[finIndex];
    if (recordObject[f].visibleTabs == 1) return;
    g(`${f}-tab-${recordObject[f].visibleTabs}`).style.display = "none";
    resetCalcTab(f, recordObject[f].visibleTabs);
    recordObject[f].visibleTabs--;
    calculateAll();
}
function resetCalcTab(f, tab) {

    for (const key of Object.keys(recordObject[f].tabs[tab - 1])) {
        if (key === 'solveForSqft' || key === 'horizOrient' || key === 'grainVertical' || key === 'size') continue;
        recordObject[f].tabs[tab - 1][key] = 0;
    }

    // reset HTML
    // TODO add any new fundermax ones. GL vs XL, probably
    g(`sheets-recc-${f}-${tab}`).innerText = "";
    g(`yieldloss-${f}-${tab}`).innerText = "";
    g(`subtotal-${f}`).innerText = "";
    g(`width-${f}-${tab}`).value = "";
    g(`height-${f}-${tab}`).value = "";
    g(`sqft-${f}-${tab}`).value = "";
    g(`panel-count-${f}-${tab}`).value = "";
    g(`perim-edges-${f}-${tab}`).value = "";
}


function resetRecordObject() {
    // resets everything but visibleTabs
    for (let finIndex = 0; finIndex < finishes.length; finIndex++) {
        let f = finishes[finIndex];
        recordObject[f].screws = 0;
        recordObject[f].finishSheetsPrices['gr'] = 0;
        recordObject[f].finishSheetsPrices['xl'] = 0;
        for (let i = 0; i < recordObject[f].tabs.length; i++) {
            for (const key of Object.keys(recordObject[f].tabs[i])) {
                // don't reset these three
                if (key === 'solveForSqft' || key === 'horizOrient' || key === 'grainVertical' || key === 'size') continue;
                recordObject[f].tabs[i][key] = 0;
            }
        }
    }
}

// TODO adjust this for fundermax tab
function createTab(finish, tab) {
    let copy = calculatorTabHTML.replaceAll('FINISH', '' + finish + '')
    copy = copy.replaceAll('TAB', tab)
    copy = copy.replaceAll('~HEIGHT~', sheetSizes[getSolidOrWood(finish)]['gr'].height) 
    copy = copy.replaceAll('~WIDTH~', sheetSizes[getSolidOrWood(finish)]['gr'].width)
    copy = copy.replaceAll('~1~', `<span id="sheets-recc-${finish}-${tab}">0</span>`)
    copy = copy.replaceAll('~2~', `<span id="panels-per-sheet-${finish}-${tab}">0</span>`)
    copy = copy.replaceAll('~3~', `<span id="yieldloss-${finish}-${tab}">0</span>%`)

    return copy;
}

function dimensionsError(f, tab) {
    g(`width-${f}-${tab}`).style.color = "#d40000";
    g(`height-${f}-${tab}`).style.color = "#d40000";
    //console.log("in error check");
    g(`sheets-recc-${f}-${tab}`).innerText = 'Error';
    let sizeString = recordObject[f].tabs[tab - 1].size == 1 ? 'xl' : 'gr';
    g(`error-height-width-div`).innerText = `${sheetSizes[getSolidOrWood(finish)][sizeString].height}x${sheetSizes[getSolidOrWood(finish)][sizeString].height}`;
    g(`error-message-${f}-${tab}`).style.display = 'block';
    g(`yieldloss-${f}-${tab}`).innerText = "0";
    g(`panels-per-sheet-${f}-${tab}`).innerText = "0";
    //g(`panel-count-${f}-${tab}`).value = "0";
    g(`subtotal-${f}`).innerText = "0";
}

function calculate(series, finIndex, tab) {

    let f = finishes[finIndex];
    // reset error stuff
    g(`error-message-${f}-${tab}`).style.display = 'none';
    g(`sheets-recc-${f}-${tab}`).innerText = "0";
    g(`width-${f}-${tab}`).style.color = "#333333";
    g(`height-${f}-${tab}`).style.color = "#333333";

    let grainVertical = recordObject[f].tabs[tab - 1].grainVertical === 1;
    let solveForSqft = recordObject[f].tabs[tab - 1].solveForSqft === 1;

    let panelWidth = getValue(`width-${f}-${tab}`);
    let panelHeight = getValue(`height-${f}-${tab}`);
    let jobArea = 0;
    let panelCount = 0;
    if (solveForSqft) {
        panelCount = getValue(`panel-count-${f}-${tab}`);
    } else {
        jobArea = getValue(`sqft-${f}-${tab}`);
    }

    if (panelWidth < 1 || panelHeight < 1 || (solveForSqft && panelCount < 1) || (!solveForSqft && jobArea < 1)) {
        g(`sheets-recc-${f}-${tab}`).innerText = "0";
        g(`yieldloss-${f}-${tab}`).innerText = "0";
        g(`panels-per-sheet-${f}-${tab}`).innerText = "0";
        if (solveForSqft) {
            g(`sqft-${f}-${tab}`).value = "";
        } else {
            g(`panel-count-${f}-${tab}`).value = "";
        }
        g(`subtotal-${f}`).innerText = "0";
        /*
        for (const key of Object.keys(recordObject[f].tabs[tab - 1])) {
            recordObject[f].tabs[tab - 1][key] = 0;
        }
        */
        for (const key of Object.keys(recordObject[f].tabs[tab - 1])) {
            if (key === 'solveForSqft' || key === 'horizOrient' || key === 'grainVertical' || key === 'size') continue;
            recordObject[f].tabs[tab - 1][key] = 0;
        }
        return;
    }

    // width = long side, height = short side
    let sizeString = recordObject[f].tabs[tab - 1].size == 1 ? 'xl' : 'gr';
    let sheetWidth = sheetSizes[sizeString].width;
    let sheetHeight = sheetSizes[sizeString].height;
    let sheetArea = (sheetWidth * sheetHeight) / 144;
    

    if (((panelWidth > sheetHeight) && (panelHeight > sheetHeight)) ||
        (panelWidth > sheetWidth) || (panelHeight > sheetWidth)) {
        dimensionsError(f, tab);
        return;
    }

    // Panels per sheet
    let totalPPS = 0;

    switch (series) {
        case 'woodgrain':
            if (grainVertical) {
                // Flipped Orientation Panels Per Sheet:
                let FO_PPS_Width = Math.floor(sheetWidth / panelHeight);
                let FO_PPS_Height = Math.floor(sheetHeight / panelWidth);
                if (FO_PPS_Width <= 0 || FO_PPS_Height <= 0) {
                    dimensionsError(f, tab);
                    return;
                }
                totalPPS = FO_PPS_Width * FO_PPS_Height;
            } else {
                // Standard Orientation Panels Per Sheet:
                let SO_PPS_Width = Math.floor(sheetWidth / panelWidth);
                let SO_PPS_Height = Math.floor(sheetHeight / panelHeight);
                if (SO_PPS_Width <= 0 || SO_PPS_Height <= 0) {
                    dimensionsError(f, tab);
                    return;
                }
                totalPPS = SO_PPS_Width * SO_PPS_Height;
            }
            break;
        case 'solid':
            // Pick the orientation that yields the most panels since grain direction is N/A
            // Standard Orientation Panels Per Sheet:
            let SO_PPS_Width = Math.floor(sheetWidth / panelWidth);
            let SO_PPS_Height = Math.floor(sheetHeight / panelHeight);
            let SO_PPS_Total = SO_PPS_Width * SO_PPS_Height;
            // Flipped Orientation Panels Per Sheet:
            let FO_PPS_Width = Math.floor(sheetWidth / panelHeight);
            let FO_PPS_Height = Math.floor(sheetHeight / panelWidth);
            let FO_PPS_Total = FO_PPS_Width * FO_PPS_Height;
            totalPPS = Math.max(FO_PPS_Total, SO_PPS_Total);
            break;
    }

    // don't do the accessory calculations if the customer is manually changing sheet qty
    if (recordObject[f].manualSheetQty) return;

    let singlePanelArea = (panelWidth * panelHeight) / 144;
    let sheetPanelArea = totalPPS * singlePanelArea;
    let sheetUtilization = sheetPanelArea / sheetArea;
    let yieldLoss = Math.round((1 - sheetUtilization) * 1000) / 10;

    if (solveForSqft) jobArea = panelCount * singlePanelArea;
    let sheetCountEstimate = Math.ceil(jobArea / sheetPanelArea);
    let sheetPluralOrNot = sheetCountEstimate > 1 ? "Sheets" : "Sheet";
    let panelString = totalPPS == 1 ? "panel" : "panels";
    g(`sheets-recc-${f}-${tab}`).innerText =
        `${addCommas(sheetCountEstimate)} ${sheetPluralOrNot}`;
    g(`panels-per-sheet-${f}-${tab}`).innerText = addCommas(totalPPS);
    g(`yieldloss-${f}-${tab}`).innerText = yieldLoss;
    if (solveForSqft) {
        g(`sqft-${f}-${tab}`).value = Math.floor(jobArea);
        recordObject[f].tabs[tab - 1].panelCount = panelCount;
    } else {
        panelCount = Math.ceil(jobArea / singlePanelArea);
        g(`panel-count-${f}-${tab}`).value = panelCount;
        recordObject[f].tabs[tab - 1].panelCount = panelCount;
    }

    recordObject[f].tabs[tab - 1].sheetPanelArea = sheetPanelArea;
    recordObject[f].tabs[tab - 1].sheetArea = sheetArea;
    recordObject[f].tabs[tab - 1].sheetCountEstimate = sheetCountEstimate;
    recordObject[f].tabs[tab - 1].panelsPerSheet = totalPPS;

    // Accessories calculations
    // Inputs
    let quantPanels = recordObject[f].tabs[tab - 1].panelCount;
    let vertEdgeOfPanels = 0;
    let horizEdgeOfPanels = 0;
    if (recordObject[f].tabs[tab - 1].horizOrient === 0) {
        vertEdgeOfPanels = panelHeight;
        horizEdgeOfPanels = panelWidth;
    } else {
        vertEdgeOfPanels = panelWidth;
        horizEdgeOfPanels = panelHeight;
    }
    let panelEdgesPerimOrCorner = getValue(`perim-edges-${f}-${tab}`);
    let extraMultiplier = 1.15;

    // Outputs
    // LF = lineal feet
    let hatExtrusionFeet =
        (((vertEdgeOfPanels * 2 / 12) * quantPanels) -
            (vertEdgeOfPanels * panelEdgesPerimOrCorner / 12)) * extraMultiplier;
    let zeeExtrusionFeet =
        (((Math.floor(((horizEdgeOfPanels - 2) / 24)) * vertEdgeOfPanels * quantPanels) +
            (panelEdgesPerimOrCorner * vertEdgeOfPanels)) / 12 * extraMultiplier)
    let hatQuantRivets = ((Math.ceil(vertEdgeOfPanels / 24) + 1) * quantPanels) * extraMultiplier;
    let zeeQuantRivets =
        ((Math.floor(((horizEdgeOfPanels - 2) / 24)) * quantPanels) + panelEdgesPerimOrCorner) * ((Math.ceil(vertEdgeOfPanels / 24)) + 1) * extraMultiplier;
    let totalQuantRivets = hatQuantRivets + zeeQuantRivets;
   
    let concealedHorizontalRailFeet = (((Math.ceil((vertEdgeOfPanels / 16) + 1) * horizEdgeOfPanels) * quantPanels) / 12) * extraMultiplier;
    let concealedClips = (Math.ceil((horizEdgeOfPanels / 16) + 1) * Math.floor(vertEdgeOfPanels / 16)) * quantPanels;
    concealedClips += Math.ceil((horizEdgeOfPanels / 16) + 1) * quantPanels;

    if (fastenerSystem === 'EF') {
        recordObject[f].screws += totalQuantRivets;
    } else {
        // 'CF'
        globalAccessoriesCount.tufsFastener += totalQuantRivets;
    }

    // Do this regardless of fastenerSystem
    globalAccessoriesCount.hatExtrusionFeet += hatExtrusionFeet;
    globalAccessoriesCount.zeeExtrusionFeet += zeeExtrusionFeet;
	globalAccessoriesCount.concealedHorizontalRailFeet += concealedHorizontalRailFeet;
    globalAccessoriesCount.concealedClips += concealedClips;
}

function createCartItem(name, quantity, noun, price) {
    item1 = document.createElement("div");
    item2 = document.createElement("div");
    item1.innerHTML = item2.innerHTML = `
		<div class="subtotal-cart--item">
		<div>
		<div>${name}</div>
		<div>${quantity} ${noun}</div>
		</div>
		<div class="div-block-70">
		<div class="text-block-11">$</div>
		<div class="text-block-11">${addCommas(price)}</div></div></div>
	`;
    g('cart-parent').appendChild(item1);
    g('order-summary-area').appendChild(item2);
}

function updateCart() {
    g('cart-parent').innerHTML = "";
    g('order-summary-area').innerHTML = "";
    g('grand-total-display').innerText = "0";
    g('grand-total').value = "0";
    grandTotal = 0;
    // add sheets to cart total
    for (let finIndex = 0; finIndex < finishes.length; finIndex++) {
    	let f = finishes[finIndex];
    	for (const size in recordObject[f].finishSheetsPrices) {
        	if (getValue(`${size}-sheets-input-${f}`) >= 1) {
        	    // create cart tab with qty and price
        	    let noun = getValue(`${size}-sheets-input-${f}`) === 1 ? 'sheet' : 'sheets';
        	    createCartItem(
        	    	`Fundermax ${f} ${size.toUpperCase()}`,
        	        getValue(`${size}-sheets-input-${f}`),
        	        noun,
        	        recordObject[f].finishSheetsPrices[size]
        	    );
        	    // update grand total
        	    grandTotal += recordObject[f].finishSheetsPrice;
        	}
        }
    }

    // add accessories to cart total
    for (let i = 0; i < accessoryIds.length; i++) {
        if (getValue(accessoryIds[i].id + "-qty") >= 1 && accessoryIds[i][fastenerSystem]) {
            // create cart tab
            let noun = getValue(accessoryIds[i].id + "-qty") === 1 ? accessoryIds[i].nounSingular : accessoryIds[i].nounPlural;
            createCartItem(
                accessoryIds[i].displayName,
                getValue(accessoryIds[i].id + "-qty"),
                noun,
                getValue(accessoryIds[i].id + "-qty") * accessoryIds[i].price
            );

            // update grand total
            grandTotal += getValue(accessoryIds[i].id + "-qty") * accessoryIds[i].price;
        }
    }

    g('grand-total-display').innerText = addCommas(grandTotal);
    g('grand-total').value = addCommas(grandTotal);
}

function calculateAll() {
    resetRecordObject();
    globalAccessoriesCount = {
        'hatExtrusionFeet': 0,
        'zeeExtrusionFeet': 0,
        'concealedHorizontalRailFeet': 0,
        'concealedClips': 0,
        'tufsFastener': 0,
    };
    for (let finIndex = 0; finIndex < finishes.length; finIndex++) {
        //let finishPrice = 0;
        let f = finishes[finIndex];
        if (g(`${f}-quantity-selection`).style.display === 'none') continue;
        if (!recordObject[f].manualSheetQty) {
        	g(`gr-sheets-input-${f}`).value = 0;
        	g(`xl-sheets-input-${f}`).value = 0;
        }
        let series = getSolidOrWood(f); // TODO moved this out of the following for loop. Double check that didn't break anything
        
        if (recordObject[f].manualSheetQty) { // If the user is inputing manual changes, respect those
        	recordObject[f].finishSheetsPrices['gr'] = g(`gr-sheets-input-${f}`).value * sheetPrices[getSolidOrWood(f)]['gr'];
        	recordObject[f].finishSheetsPrices['xl'] = g(`xl-sheets-input-${f}`).value * sheetPrices[getSolidOrWood(f)]['xl'];
        } else { // Else go through the tabs and calculate the sheet quantity that way
        	for (let tab = 1; tab <= recordObject[f].visibleTabs; tab++) {
        	    calculate(series, finIndex, tab);
        	    let sizeString = recordObject[f].tabs[tab - 1].size == 1 ? 'xl' : 'gr';
        	    let temp = getValue(`${sizeString}-sheets-input-${f}`);
        	    temp += recordObject[f].tabs[tab - 1].sheetCountEstimate;
        	    g(`${sizeString}-sheets-input-${f}`).value = temp;
        	    recordObject[f].finishSheetsPrices[sizeString] += recordObject[f].tabs[tab - 1].sheetCountEstimate *
        	        sheetPrices[getSolidOrWood(f)][sizeString];
        	}
        }
        
        g(`subtotal-${f}`).innerText = addCommas(recordObject[f].finishSheetsPrices['xl'] + recordObject[f].finishSheetsPrices['gr']);

        if (applyReccs && fastenerSystem == 'EF') {
            // Set screws in this loop since they are finish-specific
            g(`cms-${f}-qty`).value = Math.ceil(recordObject[f].screws / screwPerBox);
            g(`cms-${f}-total`).innerText = "$" + addCommas(getValue(`cms-${f}-qty`) * parseFloat(g(`screw-rivet-price`).innerText));
        }
    }
    if (applyReccs) {
        // set other accessories here since they are global
        // CF
        g(`cf-horiz-rail-qty`).value = fastenerSystem === 'CF' ? Math.ceil(globalAccessoriesCount.concealedHorizontalRailFeet / concealedHorizontalRailFeetPer) : "";
        g(`cf-horiz-rail-total`).innerText = fastenerSystem === 'CF' ? "$" + addCommas(getValue(`cf-horiz-rail-qty`) * parseFloat(g(`cf-horiz-rail-price`).innerText)) : "";
        g(`cf-clip-qty`).value = fastenerSystem === 'CF' ? Math.ceil(globalAccessoriesCount.concealedClips) : "";
        g(`cf-clip-total`).innerText = fastenerSystem === 'CF' ? "$" + addCommas(getValue(`cf-clip-qty`) * parseFloat(g(`cf-clip-price`).innerText)) : "";
        g(`tuf-s-concealed-fastener-qty`).value = fastenerSystem === 'CF' ? Math.ceil(globalAccessoriesCount.tufsFastener / tufsFastenerPerBox) : "";
        g(`tuf-s-concealed-fastener-total`).innerText = fastenerSystem === 'CF' ? "$" + addCommas(getValue(`tuf-s-concealed-fastener-qty`) * parseFloat(g(`tuf-s-concealed-fastener-price`).innerText)) : "";
        // EF
        g(`alum-hat-ext-qty`).value = fastenerSystem === 'EF' ? Math.ceil(globalAccessoriesCount.hatExtrusionFeet / hatExtrusionFeetPer) : "";
        g(`alum-hat-ext-total`).innerText = fastenerSystem === 'EF' ? "$" + addCommas(getValue(`alum-hat-ext-qty`) * parseFloat(g(`alum-hat-ext-price`).innerText)) : "";
        g(`alum-zee-ext-qty`).value = fastenerSystem === 'EF' ? Math.ceil(globalAccessoriesCount.zeeExtrusionFeet / zeeExtrusionFeetPer) : "";
        g(`alum-zee-ext-total`).innerText = fastenerSystem === 'EF' ? "$" + addCommas(getValue(`alum-zee-ext-qty`) * parseFloat(g(`alum-zee-ext-price`).innerText)) : "";
        

    }
    //console.log(recordObject);

    updateCart();
}

function addCommas(number) {
    number = Math.round(number * 100) / 100;
    number = number.toString();
    let pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(number)) {
        number = number.replace(pattern, "$1,$2");
    }

    if (number[number.length - 2] === '.') {
        number += '0';
    }

    if (!number.includes(".")) {
        number += ".00";
    }

    return number;
}
