//import modules
const cheerio = require('cheerio')
const request = require('request')
var sql = require('mysql');
const async = require("async");

var con = sql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "vina"
  });


  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");    
});


//scrape
async function scrapeWebsite(url){
  return new Promise((resolve, reject) => {
      request(url, async function(error,response,html){
          if(!error && response.statusCode == 200){
              var $ = cheerio.load(html)

              try {
                  let status = 'ok';

                  var title = '';
                  if($('.header__title h1') !== null) {
                      title = $('.header__title h1').text();
                  }

                  var meta = '';
                  if($('meta[name="description"]') !== null) {
                      meta = $('meta[name="description"]').attr('content');
                  }

                  var image = '';
                  if($('.header__img img') !== null) {
                      image = $('.header__img img').attr('src');
                  }

                  var description = '';
                  if($('.description') !== null) {
                      description = $('.description').text().trim();
                  }

                  var tasterName = '';
                  if($('.taster-area a') !== null) {
                      tasterName = $('.taster-area a').text();
                  }

                  var rating = '';
                  if($('.rating span span') !== null) {
                      rating = $('.rating span span').text();
                  }

                  let price = '';
                  $('.info-label span').each(function() {
                      if ($(this).html() == "Price") {
                          price = $(this).parent().next().find('span span').text().replace(',Buy Now', '').replace(',', '').replace("$", "");
                      }
                  });

                  var designation = '';
                  $('.info-label span').each(function() {
                      if ($(this).html() == "Designation") {
                          designation = $(this).parent().next().text().trim();
                      }
                  });

                  var variety = '';
                  $('.info-label span').each(function() {
                      if ($(this).html() == "Variety") {
                          variety = $(this).parent().next().text().trim();
                      }
                  });

                  var appellation = '';
                  $('.info-label span').each(function() {
                      if ($(this).html() == "Appellation") {
                          appellation = $(this).parent().next().text().trim();
                      }
                  });

                  var winery = '';
                  $('.info-label span').each(function() {
                      if ($(this).html() == "Winery") {
                          winery = $(this).parent().next().text().trim();
                      }
                  });

                  var alcohol = '';
                  $('.info-label span').each(function() {
                      if ($(this).html() == "Alcohol") {
                          alcohol = $(this).parent().next().text().trim().replace("%", "");
                      }
                  });

                  var bottleSize = '';
                  $('.info-label span').each(function() {
                      if ($(this).html() == "Bottle Size") {
                          bottleSize = $(this).parent().next().text().trim().replace(" ml", "");
                      }
                  });

                  var category = '';
                  $('.info-label span').each(function() {
                      if ($(this).html() == "Category") {
                          category = $(this).parent().next().find('span span').text();
                      }
                  });

                  var datePublished = '';
                  $('.info-label span').each(function() {
                      if ($(this).html() == "Date Published") {
                          datePublished = $(this).parent().next().text().trim();
                      }
                  });

                  resolve({
                      status,
                      title,
                      meta,
                      image,
                      description,
                      tasterName,
                      rating,
                      price,
                      designation,
                      variety,
                      appellation,
                      winery,
                      alcohol,
                      bottleSize,
                      category,
                      datePublished
                  });

              } catch {
                  reject({
                      status: 'offline',
                      title: '',
                      meta: '',
                      image: '',
                      description: '',
                      tasterName: '',
                      rating: '',
                      price: '',
                      designation: '',
                      variety: '',
                      appellation: '',
                      winery: '',
                      alcohol: '',
                      bottleSize: '',
                      category: '',
                      datePublished: ''
                  });
              }

          }
      })
  })
}
 
//scrapeWebsite('https://www.winemag.com/buying-guide/chateau-tanesse-2019-cadillac-cotes-de-bordeaux/');

async function repeatScrape() {
  con.query("SELECT id,url FROM winemag WHERE status != 'ok' and status != 'offline' ORDER BY id ASC LIMIT 10 ;", async function (err, rows) {
    if (err) throw err;
    else {
      if (rows.length) {
        // Use mapLimit to run 10 promises at a time
        async.mapLimit(rows, 10, async function(row) {
          var pagedbID = row.id;
          var pageUrl = row.url;
          console.log(pageUrl);
          var scrapeReturn = await scrapeWebsite(pageUrl);
          //console.log(scrapeWebsite);

          var titleEsc = con.escape(scrapeReturn.title)
          var metaEsc = con.escape(scrapeReturn.meta)
          var statusEsc = con.escape(scrapeReturn.status)
          var imageEsc = con.escape(scrapeReturn.image)
          var descriptionEsc = con.escape(scrapeReturn.description)
          var tasterNameEsc = con.escape(scrapeReturn.tasterName)
          var ratingEsc = con.escape(scrapeReturn.rating)
          var priceEsc = con.escape(scrapeReturn.price)
          var designationEsc = con.escape(scrapeReturn.designation)
          var varietyEsc = con.escape(scrapeReturn.variety)
          var appellationEsc = con.escape(scrapeReturn.appellation)
          var wineryEsc = con.escape(scrapeReturn.winery)
          var alcoholEsc = con.escape(scrapeReturn.alcohol)
          var bottleSizeEsc = con.escape(scrapeReturn.bottleSize)
          var categoryEsc = con.escape(scrapeReturn.category)
          var datePublishedEsc = con.escape(scrapeReturn.datePublished);

          var sql = "UPDATE winemag SET status="+statusEsc+", title = "+titleEsc+", meta = "+metaEsc+", image = "+imageEsc+",description = "+descriptionEsc+",tasterName = "+tasterNameEsc+",rating = "+ratingEsc+",price = "+priceEsc+",designation = "+designationEsc+",variety = "+varietyEsc+",appellation = "+ appellationEsc+",winery = "+wineryEsc+",alcohol = "+alcoholEsc+",bottleSize = "+bottleSizeEsc+",category = "+categoryEsc+",datePublished = "+datePublishedEsc+" WHERE id = '"+pagedbID+"'";

          con.query(sql, function (err, result) {
            if (err) throw err;
            console.log(result.affectedRows + " record(s) updated");
          });
        }, (err, results) => {
          if(err) throw err;
          // all urls have been processed
          repeatScrape();
        });
      }
    }
  });
}

repeatScrape();

/* 

async function repeatScrape() {
    var counting = 0;
    con.query("SELECT id,url FROM winemag WHERE status != 'ok' and status != 'offline' LIMIT 10;", async function (err, rows) {
        if (err) throw err;
        else {

            if (rows.length) {
                for (var i = 0; i < rows.length; i++) {
                    counting++;

                    var pagedbID = rows[i].id;
                    var pageUrl = rows[i].url;
                    console.log(pageUrl);

                    var scrapeReturn = await scrapeWebsite(pageUrl);

                    console.log(scrapeWebsite);

                   var titleEsc = con.escape(scrapeReturn.title)
                   var metaEsc = con.escape(scrapeReturn.meta)
                   var statusEsc = con.escape(scrapeReturn.status)
                   var imageEsc = con.escape(scrapeReturn.image)
                   var descriptionEsc = con.escape(scrapeReturn.description)
                   var tasterNameEsc = con.escape(scrapeReturn.tasterName)
                   var ratingEsc = con.escape(scrapeReturn.rating)
                   var priceEsc = con.escape(scrapeReturn.price)
                   var designationEsc = con.escape(scrapeReturn.designation)
                   var varietyEsc = con.escape(scrapeReturn.variety)
                   var appellationEsc = con.escape(scrapeReturn.appellation)
                   var wineryEsc = con.escape(scrapeReturn.winery)
                   var alcoholEsc = con.escape(scrapeReturn.alcohol)
                   var bottleSizeEsc = con.escape(scrapeReturn.bottleSize)
                   var categoryEsc = con.escape(scrapeReturn.category)
                   var datePublishedEsc = con.escape(scrapeReturn.datePublished)
                   //var statusEsc = con.escape(scrapeReturn.status)
                   console.log('ASC');

                    
                    var sql = "UPDATE winemag SET status="+statusEsc+", title = "+titleEsc+", meta = "+metaEsc+", image = "+imageEsc+",description = "+descriptionEsc+",tasterName = "+tasterNameEsc+",rating = "+ratingEsc+",price = "+priceEsc+",designation = "+designationEsc+",variety = "+varietyEsc+",appellation = "+ appellationEsc+",winery = "+wineryEsc+",alcohol = "+alcoholEsc+",bottleSize = "+bottleSizeEsc+",category = "+categoryEsc+",datePublished = "+datePublishedEsc+" WHERE id = '"+pagedbID+"'";

                    con.query(sql, function (err, result) {
                      if (err) throw err;
                      console.log(result.affectedRows + " record(s) updated");
                    });
                    

                    if(rows.length == counting) {
                        repeatScrape();
                        return;
                    }

                }
            }
        }
    })

}

*/
