// Split ordinary migrations without breaking strings, comments or dollar-quoted blocks.
export function splitSQL(sql){
  const statements=[];let start=0,quote=null,dollar=null,line=false,block=0;
  for(let i=0;i<sql.length;i++){
    const c=sql[i],next=sql[i+1];if(line){if(c==='\n')line=false;continue;}
    if(block){if(c==='/'&&next==='*'){block++;i++;}else if(c==='*'&&next==='/'){block--;i++;}continue;}
    if(dollar){if(sql.startsWith(dollar,i)){i+=dollar.length-1;dollar=null;}continue;}
    if(quote){if(c===quote){if(next===quote)i++;else quote=null;}continue;}
    if(c==='-'&&next==='-'){line=true;i++;continue;}if(c==='/'&&next==='*'){block=1;i++;continue;}
    if(c==="'"||c==='"'){quote=c;continue;}if(c==='$'){const tag=sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/)?.[0];if(tag){dollar=tag;i+=tag.length-1;continue;}}
    if(c===';'){const statement=sql.slice(start,i).trim();if(statement)statements.push(statement);start=i+1;}
  }
  const end=sql.slice(start).trim();if(end)statements.push(end);if(quote||dollar||block)throw new Error('Unclosed SQL literal or comment');return statements;
}
