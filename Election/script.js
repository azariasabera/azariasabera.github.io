const jsonQuery = 
    {
        "query": [
            {
            "code": "Vuosi",
            "selection": {
                "filter": "item",
                "values": [1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2017, 2021]
            }
            },
            {
            "code": "Alue",
            "selection": {
                "filter": "item",
                "values": [
                "000000"
                ]
            }
            },
            {
            "code": "Puolue",
            "selection": {
                "filter": "item",
                "values": [
                "03",
                "01",
                "04",
                "02",
                "06",
                "07",
                "08",
                "80"
                ]
            }
            },
            {
            "code": "Tiedot",
            "selection": {
                "filter": "item",
                "values": [
                "osuus_aanista"
                ]
            }
            }
        ],
        "response": {
            "format": "json-stat2"
        }

    }

const getData = async () => { // Fetches the data from the API
    const url = "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/kvaa/statfin_kvaa_pxt_12g3.px"
    const res = await fetch(url, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify(jsonQuery)
    })
    if(!res.ok) {
        return;
    }
    const data = await res.json()
    return data
}

const buildChart = async (type="line") => { // Builds the chart with the data
    const data = await getData()

    const dataValues = data.value;
    const years = Object.values(data.dimension.Vuosi.category.label);
    const sortingCriteria = data.dimension.Puolue.category.index; // Sorting criteria for the parties
    const partiesWithNames = data.dimension.Puolue.category.label;  // Party names
    let parties = Object.values(partiesWithNames);

    parties.forEach((party, index) => {
        let partySupport = []; // to store the data for each party
        const partyCode = Object.keys(partiesWithNames).find(key => partiesWithNames[key] === party);
        dataValues.forEach((value, i) => {
            if((i) % parties.length === sortingCriteria[partyCode]) {
                partySupport.push(value)
            }
        })
        parties[index] = {
            name: party,
            values: partySupport
        }
    })

    const chartData = {
        labels: years,
        datasets: parties
    }

    const chart = new frappe.Chart("#chart", {
        title: "Votes in Finnish municipalities",
        data: chartData,
        type: type,
        height: 450,
        colors: ["red", "blue", "green", "black", "purple", "orange", "#FF00FF", "#00FF00"],
    })
}

document.addEventListener("DOMContentLoaded", async () => {
    const dropdownInput = document.getElementById("dropdownInput");
    const dropdownList = document.getElementById("dropdownList");
    const dropdown = document.querySelector(".dropdown");
    const selectYear = document.getElementById("selectYear");
    const selectParty = document.getElementById("selectParty");
    const singleYearDiv = document.getElementById("singleYearDiv");
    const showSingleYear = document.getElementById("showSingleYear");
    const yearRangeDiv = document.getElementById("yearRangeDiv");
    const singleYear = document.getElementById("singleYear");
    const download = document.getElementById("downloadChart");
    const arrowDown = document.getElementById("arrowDown");

    download.addEventListener("click", () => { // Downloads the chart as a PNG image
        html2canvas(document.getElementById("chart")).then(canvas => {
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = "chart.png";
            link.click();
        });
    });
    

    yearsArray = [1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2017, 2021];

    const fetchMunicipality = async () => { // Fetches the municipalities from a JSON file
        const url = "../../Data/municipalities.json"; 
        const res = await fetch(url)
        const data = await res.json()   
        return data
    };

    const populateDropdown = async () => { // Populates the dropdown with the regions

        dropdownList.innerHTML = ''; // Clears the dropdown list first

        const optionValues = await fetchMunicipality();
        Object.entries(optionValues).forEach(([key, value]) => {
            const option = document.createElement('div');
            option.textContent = value;
            option.dataset.value = key; // Sets the dataset value to the key

            option.addEventListener('click', () => { // When an option is clicked
                dropdownInput.value = value;
                dropdown.classList.remove('dropdown-active'); // Hides the dropdown

                if (dropdownInput.value === "single")
                    singleYearDiv.style.display = "block";
                else
                    jsonQuery.query[1].selection.values = [key];
                    if (showSingleYear.checked) 
                        buildChart("bar");
                    else
                        buildChart();
            });
            dropdownList.appendChild(option)
        });
    }

    function filterOptions() { // Filters the options in the dropdown
        const filterText = dropdownInput.value.toLowerCase();

        const options = dropdownList.children; // these are divs
        Object.values(options).forEach(option => {
            const text = option.textContent.toLocaleLowerCase();
            if (text.includes(filterText)) // If the text includes the filter text
                option.style.display = ''; // display
            else
                option.style.display = 'none'; // don't display
        })
    }

    dropdownInput.addEventListener("focus", function() {
        dropdown.classList.add("dropdown-active");
    });

    dropdownInput.addEventListener("blur", function() {
        // Timeout to allow click event to register before hiding
        setTimeout(() => {
            dropdown.classList.remove("dropdown-active");
        }, 200);
    });

    selectYear.addEventListener("change", () => {
        const years = yearsArray.filter(year => year >= parseInt(selectYear.value));
        jsonQuery.query[0].selection.values = years;
        buildChart();
    });

    singleYear.addEventListener("change", () => {
        jsonQuery.query[0].selection.values = [parseInt(singleYear.value)];
        buildChart("bar");
    });

    selectParty.addEventListener("change", () => {
        if(selectParty.value === "all") {
            jsonQuery.query[2].selection.values = [
                "03",
                "01",
                "04",
                "02",
                "06",
                "07",
                "08",
                "80"
            ]
        } else {
            jsonQuery.query[2].selection.values = [selectParty.value];
        }

        if (showSingleYear.checked) // Only show the bar for showing single year
            buildChart("bar");
        else
            buildChart();
    });

    showSingleYear.addEventListener("change", () => {
        if(showSingleYear.checked) {
            singleYearDiv.style.display = "block";
            yearRangeDiv.style.display = "none";
            showSingleYear.textContent = "Hide year range";
            jsonQuery.query[0].selection.values = [parseInt(singleYear.value)];
            buildChart("bar");  
        } else {
            yearRangeDiv.style.display = "block";
            singleYearDiv.style.display = "none";
            jsonQuery.query[0].selection.values = [1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2017, 2021];
            buildChart();
        }
    });

    arrowDown.addEventListener("click", () => {
        dropdown.scrollIntoView({behavior: "smooth"});
    });

    dropdownInput.addEventListener("input", filterOptions);
    populateDropdown();
    buildChart();
});
