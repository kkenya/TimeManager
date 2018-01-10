let visited = false;
        if (document.cookie) {
            const cookies = document.cookie.split(";");
            for (cookie in cookies) { //cookies[0] => mdn=djslafj, cookies[1] => visted=true;;
                if (cookie.split("=")[0] == "visited" && cookie.split("=")[1] == "true") {
                    visted = true;
                }
            }
        } else if (!visited) {
            document.cookie = `visited=true;max-age=${60 * 60 * 24 * 365};`;
            introJs().start();
        }