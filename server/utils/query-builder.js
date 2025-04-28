"use strict";
let _ = require('lodash');
let parser = require("odata-parser");


module.exports = class QueryBuilder {
    constructor (replacements, $$){
        this.replacements = replacements;
        this.$$ = $$;
    }

    formatName (name){
        if (this.replacements && this.replacements[name]) {
            return this.replacements[name];
        }else if(name.indexOf('/') > -1) {
            return this.$$('(' + _.reduce(name.split('/'), (r, v, i, c) => {
                    if (i + 1 === c.length) {
                        return r + "->>'" + v + "'";
                    } else if (i > 0) {
                        return r + "->'" + v + "'";
                    } else {
                        return v;
                    }
                }) + ')');
        } else if(name.indexOf('___') > -1){
            return this.$$('(' + _.reduce(name.split('___'), (r, v, i, c) => {
                    if (i + 1 === c.length) {
                        return r + "->>'" + v + "'";
                    } else if (i > 0) {
                        return r + "->'" + v + "'";
                    } else {
                        return v;
                    }
                }) + ')');
        }
        else{
            return name;
        }
    }

    // fixes a bug in the odata parser
    fixAst (filter){
        if (!filter.type && filter[2] && filter[5]) {
            filter = {
                left: filter[2],
                type: filter[5][1],
                right: filter[5][3]
            };
        }else if (!filter.type && filter[2]){
            filter = this.fixAst(filter[2]);
        }
        return filter;
    }

    recursiveFilter(left, right, type, query) {
        left = this.fixAst(left);
        right = this.fixAst(right);

        if (right.type === "literal") {
            if (type === "eq" && left.func === "substringof") {
                return query.where(this.formatName(left.args[0].name), 'ilike', '%' + left.args[1].value + '%');
            }
            else if (type === "eq") {
                return query.where(this.formatName(left.name), right.value);
            }
            else if (type === "ne") {
                return query.where(this.formatName(left.name), this.$$(' IS DISTINCT FROM '), right.value);
            }
            else if (type === "ge") {
                return query.where(this.formatName(left.name), '>=', right.value);
            }
            else if (type === "le") {
                return query.where(this.formatName(left.name), '<=', right.value);
            }
        }
        else if(type === "or"){
            query.where(qb => this.recursiveFilter( left.left,  left.right,  left.type, qb))
               .orWhere(qb => this.recursiveFilter(right.left, right.right, right.type, qb));
        }
        else {
            query.where(qb => this.recursiveFilter( left.left,  left.right,  left.type, qb))
              .andWhere(qb => this.recursiveFilter(right.left, right.right, right.type, qb));
        }
    }

    createQuery (query, queryString) {
        //https://github.com/auth0/node-odata-parser
        if (queryString.$filter) {
            let ast = parser.parse("$filter=" + queryString.$filter);
            ast.$filter = this.fixAst(ast.$filter);
            query.andWhere(qb => this.recursiveFilter(ast.$filter.left, ast.$filter.right, ast.$filter.type, qb));
        }

        if (queryString.$top) {
            query.limit(queryString.$top);
        }

        if (queryString.$skip) {
            query.offset(queryString.$skip);
        }

        if (queryString.$orderby) {
            let orderBy = parser.parse("$orderby=" + queryString.$orderby.replace(/\//g, '___'));
            _.each(orderBy.$orderby,  (item) => {
                let key = Object.keys(item)[0];
                query.orderBy( this.formatName(key) , item[key]);
            });
            //if (groupBy) {
            //    groupBy = [groupBy].concat(_.map(orderBy.$orderby, function (v){ return formatName(Object.keys(v)[0]);}));
            //    query.groupBy.apply(query,groupBy);
            //}
        }
        //else if(groupBy){
        //    query.groupBy(groupBy);
        //}

        return query;
    }

    orderBy (query, queryString){
        //$orderby
        if (queryString.$orderby) {
            let orderBy = parser.parse("$orderby=" + queryString.$orderby.replace(/\//g, '___'));
            _.each(orderBy.$orderby, (item) => {
                let key = Object.keys(item)[0];
                query.orderBy( this.formatName(key) , item[key]);
            });
        }
        return query;
    }
};
