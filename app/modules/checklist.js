function getCSSArray()
{
var links = document.getElementsByTagName("link");
var link;
for(var i = 0; i < links.length; i++)
{
    link = links[i];
    if(/stylesheet/.test(link.rel))
    {
        sheets.push(link);
    }
}

    return sheets;
}

function printView()
{
var sheet;
var title1 = "printVersion";
for(i = 0; i < sheets.length; i++)
{
    sheet = sheets[i];
            if(sheet.title == title1)
    {
        sheet.disabled = false;
    }
    else
    {
        sheet.disabled = true;
    }
