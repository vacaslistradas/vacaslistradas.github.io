
document.addEventListener('DOMContentLoaded', function () {

    function preloadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn(`Failed to load image: ${url}`);
                resolve(null);  
            };
            img.src = url;
        });
    }

    function createFileAttachment(filename) {
        return {
            url: async function () {
                const response = await fetch(`./images/${filename}`);
                if (!response.ok) throw new Error(`Failed to load ${filename}`);
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            }
        };
    }

    const imageAttachments = new Map([
        ["Mark Trumbo", createFileAttachment("Mark Trumbo.jpeg")],
        ["Nelson Cruz", createFileAttachment("Nelson Cruz.jpeg")],
        ["Edwin Encarnacion", createFileAttachment("Edwin Encarnacion.jpeg")],
        ["Khris Davis", createFileAttachment("Khris Davis.jpeg")],
        ["James Dozier", createFileAttachment("James Dozier.jpeg")],
        ["Nolan Arenado", createFileAttachment("Nolan Arenado.jpeg")],
        ["Vernon Carter", createFileAttachment("Vernon Carter.jpeg")],
        ["Todd Frazier", createFileAttachment("Todd Frazier.jpeg")],
        ["Kristopher Bryant", createFileAttachment("Kristopher Bryant.jpeg")],
        ["Robinson Cano", createFileAttachment("Robinson Cano.jpeg")],
        ["Christopher Davis", createFileAttachment("Christopher Davisjpeg")],
        ["David Ortiz", createFileAttachment("David Ortiz.jpeg")],
        ["Jose Cabrera", createFileAttachment("Jose Cabrera.jpeg")],
        ["Joshua Donaldson", createFileAttachment("Joshua Donaldson.jpeg")],
        ["Manuel Machado", createFileAttachment("Manuel Machado.jpeg")],
        ["Christopher Davis", createFileAttachment("Christopher Davis.jpeg")]
    ]);


    const imageUrls = {
        "Mark Trumbo": "./images/Mark Trumbo.jpeg",
        "Nelson Cruz": "./images/Nelson Cruz.jpeg",
        "Edwin Encarnacion": "./images/Edwin Encarnacion.jpeg",
        "Khris Davis": "./images/Khris Davis.jpeg",
        "James Dozier": "./images/James Dozier.jpeg",
        "Nolan Arenado": "./images/Nolan Arenado.jpeg",
        "Vernon Carter": "./images/Vernon Carter.jpeg",
        "Todd Frazier": "./images/Todd Frazier.jpeg",
        "Kristopher Bryant": "./images/Kristopher Bryant.jpeg",
        "Robinson Cano": "./images/Robinson Cano.jpeg",
        "Christopher Davis": "./images/Christopher Davis.jpeg",
        "David Ortiz": "./images/David Ortiz.jpeg",
        "Jose Cabrera": "./images/Jose Cabrera.jpeg",
        "Joshua Donaldson": "./images/Joshua Donaldson.jpeg",
        "Manuel Machado": "./images/Manuel Machado.jpeg"
    };




    Promise.all([
        d3.csv('data2.csv'),
        d3.csv('Team_venue_info.csv'),
        fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(response => response.json()),
        fetch("https://gist.githubusercontent.com/Brideau/2391df60938462571ca9/raw/f5a1f3b47ff671eaf2fb7e7b798bacfc6962606a/canadaprovtopo.json").then(response => response.json()),
        ...Object.entries(imageUrls).map(([name, url]) =>
            preloadImage(url).then(img => [name, img])
        )
    ]).then(([data2Raw, venue_dataRaw, us_topology, canada_topology, ...loadedImages]) => {

        const container = document.createElement('div');
        container.id = 'baseball-viz';
        document.getElementById('viz1-container').appendChild(container);


        async function getPlayerImageUrl(player) {
            try {
              const attachment = imageAttachments.get(player.name);
              if (attachment) {
                const imageFile = await attachment.url();
                return imageFile;
              }
              return null;
            } catch (error) {
              console.error(`Error loading image for ${player.name}:`, error);
              return null;
            }
          }
    

    const width = 1100;
    const height = 600;
    let selectedPlayers = [];
    let comparisonMode = false;
    let firstSelectedPlayer = null;
    const playerColors = ["#3b82f6", "#ef4444"];
    const mainDiv = d3.select('#baseball-viz')
        .append('div')
        .style("width", `${width}px`)
        .style("height", `${height}px`)
        .style("margin", "0 auto")
        .style("position", "relative")
        .style("background", "#f8fafc")
        .style("border-radius", "12px")
        .style("padding", "20px")
        .style("box-shadow", "0 4px 6px -1px rgba(0, 0, 0, 0.1)")
        .style("overflow", "hidden");


    window.venue_data = venue_dataRaw;
    const data2 = data2Raw.map(row => ({
        ...row,
        durationMinutes: +row.durationMinutes
    }));



    function addStat(container, label, value) {
        const stat = container.append("div")
            .style("text-align", "left");

        stat.append("div")
            .style("font-size", "12px")
            .style("color", "#64748b")
            .style("margin-bottom", "4px")
            .text(label);

        stat.append("div")
            .style("font-size", "16px")
            .style("color", "#1e293b")
            .style("font-weight", "500")
            .text(value);
    }

    function formatHeight(inches) {
        const feet = Math.floor(inches / 12);
        const remainingInches = inches % 12;
        return `${feet}'${remainingInches}"`;
    }

    function addPlayerInfoColumn(container, player, color = null) {
        const infoColumn = container.append("div")
            .style("flex", "0 0 250px")
            .style("padding-right", "24px")
            .style("padding-top", "40px") 
            .style("border-right", "1px solid #e2e8f0");

        infoColumn.append("h2")
            .style("font-size", "24px")
            .style("font-weight", "bold")
            .style("margin-bottom", "16px")
            .style("color", color || "#1e293b")
            .text(player.name);

        const statsList = infoColumn.append("div")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("gap", "16px");

        addStat(statsList, "Team", player.team);
        addStat(statsList, "Home Runs", player.count);
        addStat(statsList, "Bats", player.batHand);

        const inningStats = calculateInningStats(player.inningData);
        addStat(statsList, "Most HRs in Inning", `Inning ${inningStats.mostCommonInning} (${inningStats.maxHRs} HRs)`);
        addStat(statsList, "Avg HR Inning", inningStats.avgInning.toFixed(1));
    }

    function calculateInningStats(inningData) {
        const mostCommonInning = inningData.reduce((a, b) =>
            (a.count > b.count) ? a : b
        );

        const totalHRs = inningData.reduce((sum, d) => sum + d.count, 0);
        const weightedSum = inningData.reduce((sum, d) => sum + (d.inning * d.count), 0);
        const avgInning = weightedSum / totalHRs;

        return {
            mostCommonInning: mostCommonInning.inning,
            maxHRs: mostCommonInning.count,
            avgInning: avgInning
        };
    }

    const playerHomeRuns = d3.rollup(data2,
        v => {
            const teamCounts = d3.rollup(v,
                games => games.length,
                game => {
                    const isHome = [game.homeFielder1, game.homeFielder2, game.homeFielder3,
                    game.homeFielder4, game.homeFielder5, game.homeFielder6,
                    game.homeFielder7, game.homeFielder8, game.homeFielder9]
                        .includes(game.hitterId);
                    return isHome ? game.homeTeamName : game.awayTeamName;
                }
            );

            const primaryTeam = Array.from(teamCounts.entries())
                .sort((a, b) => b[1] - a[1])[0][0];

            const inningData = Array(20).fill(0); 
            v.forEach(hr => {
                if (hr && hr.inningNumber) {
                    const inning = hr.inningNumber - 1; 
                    if (inning >= 0 && inning < 20) {
                        inningData[inning]++;
                    }
                }
            });

            const formattedInningData = inningData.map((count, i) => ({
                inning: i + 1,
                count: count
            })).filter(d => d.count > 0); 

            return {
                count: v.length,
                name: v[0].hitterFullName,
                team: primaryTeam,
                height: v[0].hitterHeight,
                weight: v[0].hitterWeight,
                batHand: v[0].hitterBatHand,
                inningData: formattedInningData
            };
        },
        d => d.hitterFullName
    );


    const introOverlay = mainDiv.append("div")
        .style("position", "absolute")
        .style("top", "0")
        .style("left", "0")
        .style("width", "100%")
        .style("height", "100%")
        .style("background", "rgba(248, 250, 252, 0.95)")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("padding", "2rem")
        .style("z-index", "1000");

    introOverlay.append("h1")
        .style("font-size", "2rem")
        .style("font-weight", "bold")
        .style("margin-bottom", "1.5rem")
        .style("color", "#1e293b")
        .text("MLB Home Run Leaders");

    introOverlay.append("p")
        .style("font-size", "1.1rem")
        .style("line-height", "1.6")
        .style("max-width", "600px")
        .style("text-align", "center")
        .style("margin-bottom", "2rem")
        .style("color", "#475569")
        .html("Explore the 2016 MLB season's top home run hitters. <br>Click on any player to see their home run distribution by inning, or compare two players to analyze their patterns.");

    introOverlay.append("button")
        .style("padding", "0.75rem 1.5rem")
        .style("background", "#3b82f6")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "0.5rem")
        .style("font-size", "1rem")
        .style("cursor", "pointer")
        .style("transition", "background 0.2s")
        .text("Start Exploring")
        .on("mouseover", function () {
            d3.select(this).style("background", "#2563eb");
        })
        .on("mouseout", function () {
            d3.select(this).style("background", "#3b82f6");
        })
        .on("click", function () {
            introOverlay.style("opacity", "0")
                .style("pointer-events", "none");
        });

    mainDiv.append("h2")
        .style("text-align", "center")
        .style("margin", "0 0 20px 0")
        .style("color", "#1e293b")
        .style("font-size", "24px")
        .text("MLB Home Run Leaders");

    const grid = mainDiv.append("div")
        .style("display", "grid")
        .style("grid-template-columns", "repeat(7, 1fr)")
        .style("gap", "12px")
        .style("padding", "8px");

    const sortedPlayers = Array.from(playerHomeRuns.entries())
        .map(([name, data]) => ({
            name: name,
            ...data
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 14);


    const instructionsOverlay = mainDiv.append("div")
        .style("position", "absolute")
        .style("bottom", "20px")  
        .style("left", "50%") 
        .style("transform", "translateX(-50%)")  
        .style("background", "white")
        .style("padding", "12px 16px")
        .style("border-radius", "8px")
        .style("box-shadow", "0 4px 6px -1px rgba(0, 0, 0, 0.1)")
        .style("display", "none")
        .style("align-items", "center")
        .style("gap", "12px")
        .style("z-index", "999");

   
    instructionsOverlay.append("span")
        .style("font-size", "14px")
        .style("color", "#1e293b")
        .text("Select another player to compare");

    instructionsOverlay.append("button")
        .style("padding", "6px 12px")
        .style("background", "#ef4444")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("cursor", "pointer")
        .style("margin-left", "8px")
        .text("Cancel")
        .on("click", () => {
            comparisonMode = false;
            selectedPlayers = [];
            firstSelectedPlayer = null;
            instructionsOverlay.style("display", "none");
            updateAllSelectionBadges();
        });

    mainDiv.select("h2").remove();


    const modal = mainDiv.append("div")
        .style("position", "absolute")
        .style("top", "0")
        .style("left", "0")
        .style("width", "100%")
        .style("height", "100%")
        .style("background", "rgba(15, 23, 42, 0.75)")
        .style("display", "none")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("z-index", "1000");

    const modalContent = modal.append("div")
        .style("background", "white")
        .style("border-radius", "12px")
        .style("width", "90%")
        .style("max-width", "800px")
        .style("max-height", "80%")
        .style("position", "relative")
        .style("padding", "24px")
        .style("overflow-y", "auto")
        .style("z-index", "1001");

    function createPlayerCard(player, i) {
        const card = grid.append("div")
            .style("position", "relative")
            .style("aspect-ratio", "2/3")
            .style("border-radius", "8px")
            .style("overflow", "hidden")
            .style("background", "white")
            .style("box-shadow", "0 1px 3px 0 rgba(0, 0, 0, 0.1)")
            .style("transition", "transform 0.2s, box-shadow 0.2s")
            .style("cursor", "pointer")
            .attr("data-player", player.name);


        card.on("click", () => {
            handleCardClick(player);
        });

        const selectionBadge = card.append("div")
            .style("position", "absolute")
            .style("top", "10px")
            .style("right", "10px")
            .style("background", "#3b82f6")
            .style("color", "white")
            .style("padding", "4px 8px")
            .style("border-radius", "9999px")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("opacity", "0")
            .style("transform", "scale(0)")
            .style("transition", "all 0.2s")
            .style("z-index", "2")
            .text("Selected");

        card.node().__selectionBadge = selectionBadge;

        getPlayerImageUrl(player).then(imageUrl => {
            if (imageUrl) {
                card.style("background-image", `url(${imageUrl})`)
                    .style("background-size", "contain")
                    .style("background-position", "center")
                    .style("background-repeat", "no-repeat");
            }
        });

        card.append("div")
            .style("position", "absolute")
            .style("left", "0")
            .style("right", "0")
            .style("bottom", "0")
            .style("height", "25%")
            .style("background", "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0) 100%)");

        const info = card.append("div")
            .style("position", "absolute")
            .style("bottom", "8px")
            .style("left", "0")
            .style("right", "0")
            .style("padding", "8px")
            .style("color", "white")
            .style("text-align", "left");

        const contentContainer = info.append("div")
            .style("display", "flex")
            .style("align-items", "flex-start")
            .style("gap", "8px");

        contentContainer.append("div")
            .style("background", i < 3 ? "rgba(254, 243, 199, 0.9)" : "rgba(241, 245, 249, 0.9)")
            .style("color", i < 3 ? "#92400e" : "#64748b")
            .style("min-width", "22px")
            .style("height", "22px")
            .style("border-radius", "11px")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("font-weight", "bold")
            .style("font-size", "11px")
            .style("margin-top", "2px")
            .text(i + 1);

        const textContainer = contentContainer.append("div")
            .style("flex", "1");

        textContainer.append("div")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .style("line-height", "1.2")
            .style("margin-bottom", "3px")
            .text(player.name);

        textContainer.append("div")
            .style("font-size", "11px")
            .style("opacity", "0.9")
            .style("line-height", "1.2")
            .text(`${player.count} HRs • ${player.team}`);

        card.on("click", () => {
            handleCardClick(player);

            if (comparisonMode && selectedPlayers.includes(player)) {
                selectionBadge
                    .style("opacity", "1")
                    .style("transform", "scale(1)");
            } else {
                selectionBadge
                    .style("opacity", "0")
                    .style("transform", "scale(0)");
            }
        });

        card
            .on("mouseover", function () {
                d3.select(this)
                    .style("transform", "translateY(-2px)")
                    .style("box-shadow", "0 4px 6px -1px rgba(0, 0, 0, 0.1)");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .style("transform", "none")
                    .style("box-shadow", "0 1px 3px 0 rgba(0, 0, 0, 0.1)");
            });

        return card;
    }

    function handleCardClick(player) {
        console.log("Card clicked:", player.name);
        console.log("Comparison mode:", comparisonMode);
        console.log("First selected player:", firstSelectedPlayer?.name);
        console.log("Selected players:", selectedPlayers.map(p => p.name));

        if (comparisonMode) {
            if (firstSelectedPlayer && player.name !== firstSelectedPlayer.name) {
                selectedPlayers = [firstSelectedPlayer, player];
                comparisonMode = false;
                instructionsOverlay.style("display", "none");
                showComparisonModal(firstSelectedPlayer, player);
                firstSelectedPlayer = null;
                updateAllSelectionBadges();
            }
        } else {
            firstSelectedPlayer = null;
            selectedPlayers = [];
            showPlayerModal(player);
        }
    }

    modal.on("click", function (event) {
        if (event.target === this) {
            hideModal();
        }
    });

    function hideModal() {
        modal.selectAll("*").on(".", null);
        modal.style("display", "none");
        d3.selectAll(".histogram-tooltip").remove();
        instructionsOverlay.style("display", "none");

        if (!comparisonMode) {
            firstSelectedPlayer = null;
            updateAllSelectionBadges();
        }
    }

    function showPlayerModal(player) {
        modalContent.html("")
            .style("max-height", "none")  
            .style("overflow", "visible")  
            .style("height", "auto");     

        const modalLayout = modalContent.append("div")
            .style("display", "flex")
            .style("gap", "24px")
            .style("height", "480px")    
            .style("width", "100%");

        addPlayerInfoColumn(modalLayout, player);

        const histogramColumn = modalLayout.append("div")
            .style("flex", "1")
            .style("min-width", "0")
            .style("height", "100%");

        modalContent.append("button")
            .style("position", "absolute")
            .style("left", "16px")
            .style("top", "16px")
            .style("padding", "8px 16px")
            .style("background", "#3b82f6")
            .style("color", "white")
            .style("border", "none")
            .style("border-radius", "4px")
            .style("cursor", "pointer")
            .text("Compare with Another Player")
            .on("click", () => {
                firstSelectedPlayer = player;
                selectedPlayers = [player];
                comparisonMode = true;
                hideModal();
                instructionsOverlay.style("display", "flex");
                updateAllSelectionBadges();
            });

        addCloseButton(modalContent);

        modal.style("display", "flex");
        createHistogram(histogramColumn, [player], playerColors[0]);
    }

    function updateAllSelectionBadges() {
        grid.selectAll("div[data-player]").each(function () {
            const card = d3.select(this);
            const playerName = card.attr("data-player");
            const selectionBadge = card.node().__selectionBadge;

            if (comparisonMode && firstSelectedPlayer && firstSelectedPlayer.name === playerName) {
                selectionBadge
                    .style("opacity", "1")
                    .style("transform", "scale(1)");
            } else {
                selectionBadge
                    .style("opacity", "0")
                    .style("transform", "scale(0)");
            }
        });
    }

    function showComparisonModal(player1, player2) {
        modalContent.html("")
            .style("max-height", "none")  
            .style("overflow", "visible") 
            .style("height", "auto");     

        const infoSection = modalContent.append("div")
            .style("width", "100%")
            .style("padding-bottom", "20px")
            .style("border-bottom", "1px solid #e2e8f0");

        const player1Info = infoSection.append("div")
            .style("display", "inline-block")
            .style("margin-right", "20px")
            .style("color", playerColors[0]);

        player1Info.append("span")
            .style("font-weight", "bold")
            .style("font-size", "15px")
            .text(player1.name);

        player1Info.append("span")
            .style("color", "#64748b")
            .style("margin-left", "8px")
            .style("font-size", "14px")
            .text(`${player1.count} HRs • ${player1.team} • Bats: ${player1.batHand}`);

        infoSection.append("span")
            .style("margin", "0 12px")
            .style("font-weight", "bold")
            .style("color", "#64748b")
            .text("vs");

        const player2Info = infoSection.append("div")
            .style("display", "inline-block")
            .style("margin-left", "20px")
            .style("color", playerColors[1]);

        player2Info.append("span")
            .style("font-weight", "bold")
            .style("font-size", "15px")
            .text(player2.name);

        player2Info.append("span")
            .style("color", "#64748b")
            .style("margin-left", "8px")
            .style("font-size", "14px")
            .text(`${player2.count} HRs • ${player2.team} • Bats: ${player2.batHand}`);

        const histogramContainer = modalContent.append("div")
            .style("height", "400px")    
            .style("margin-top", "20px");

        addCloseButton(modalContent);

        modal.style("display", "flex");

        createHistogram(histogramContainer, [player1, player2], null, true);
    }

    function createHistogram(container, players, color = null, isComparison = false) {
        const containerRect = container.node().getBoundingClientRect();
        const margin = { top: 40, right: 30, bottom: 60, left: 50 };
        const width = containerRect.width - margin.left - margin.right;
        const height = containerRect.height - margin.top - margin.bottom;

        container.html("");

        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "white")
            .style("color", "#1e293b")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
            .style("pointer-events", "none")
            .style("z-index", "1000");

        const svg = container.append("svg")
            .attr("width", containerRect.width)
            .attr("height", containerRect.height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const maxInning = d3.max(players.flatMap(p =>
            p.inningData.map(d => d.inning)
        ));

        const x = d3.scaleBand()
            .domain(d3.range(1, maxInning + 1))
            .range([0, width])
            .padding(0.1);

        const maxCount = d3.max(players.flatMap(p => p.inningData.map(d => d.count)));
        const y = d3.scaleLinear()
            .domain([0, maxCount])
            .nice()
            .range([height, 0]);

        players.forEach((player, i) => {
            svg.selectAll(`.bars-${i}`)
                .data(player.inningData)
                .enter()
                .append("rect")
                .attr("class", `bars-${i}`)
                .attr("x", d => x(d.inning))
                .attr("y", d => y(d.count))
                .attr("width", x.bandwidth() / (isComparison ? 2 : 1))
                .attr("height", d => height - y(d.count))
                .attr("fill", isComparison ? playerColors[i] : (color || playerColors[0]))
                .attr("opacity", 0.7)  
                .attr("transform", isComparison ? `translate(${i * x.bandwidth() / 2}, 0)` : null)
                .on("mouseover", function (event, d) {
                    const bar = d3.select(this);
                    bar.attr("opacity", 1);  

                    const tooltipText = isComparison ?
                        `${player.name}: ${d.count} HR${d.count !== 1 ? 's' : ''} in inning ${d.inning}` :
                        `${d.count} HR${d.count !== 1 ? 's' : ''} in inning ${d.inning}`;

                    tooltip
                        .style("visibility", "visible")
                        .html(tooltipText)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("opacity", 0.7);  
                    tooltip.style("visibility", "hidden");
                });
        });

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d => `${d}`));

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(isComparison ? "Home Runs by Inning Comparison" : "Home Runs by Inning");

        if (isComparison) {
            const legend = svg.append("g")
                .attr("transform", `translate(${width - 200}, ${-margin.top / 2})`);

            players.forEach((player, i) => {
                legend.append("rect")
                    .attr("x", i * 100)
                    .attr("y", -10)
                    .attr("width", 15)
                    .attr("height", 15)
                    .attr("fill", playerColors[i]);

                legend.append("text")
                    .attr("x", i * 100 + 20)
                    .attr("y", 2)
                    .style("font-size", "12px")
                    .text(player.name.split(" ")[1]);
            });
        }

        return tooltip; 
    }


    function addCloseButton(container) {
        container.append("button")
            .style("position", "absolute")
            .style("right", "16px")
            .style("top", "16px")
            .style("background", "none")
            .style("border", "none")
            .style("font-size", "24px")
            .style("cursor", "pointer")
            .style("color", "#64748b")
            .text("×")
            .on("click", hideModal);
    }


    sortedPlayers.forEach((player, i) => createPlayerCard(player, i));

}).catch(error => {
    console.error('Error loading resources:', error);
    document.body.innerHTML += `
            <div style="color: red; padding: 20px; text-align: center;">
                Error loading visualization. Please check the console for details.
            </div>
        `;
});
});