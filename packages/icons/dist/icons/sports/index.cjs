"use client";
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var sports_exports = {};
__export(sports_exports, {
  BallAmericanFootballIcon: () => import_ball_american_football.BallAmericanFootballIcon,
  BallAmericanFootballOffIcon: () => import_ball_american_football_off.BallAmericanFootballOffIcon,
  BallBaseballIcon: () => import_ball_baseball.BallBaseballIcon,
  BallBasketballIcon: () => import_ball_basketball.BallBasketballIcon,
  BallBowlingIcon: () => import_ball_bowling.BallBowlingIcon,
  BallFootballIcon: () => import_ball_football.BallFootballIcon,
  BallFootballOffIcon: () => import_ball_football_off.BallFootballOffIcon,
  BallTennisIcon: () => import_ball_tennis.BallTennisIcon,
  BallVolleyballIcon: () => import_ball_volleyball.BallVolleyballIcon,
  DumbbellIcon: () => import_dumbbell.DumbbellIcon,
  GoalIcon: () => import_goal.GoalIcon,
  MedalIcon: () => import_medal.MedalIcon,
  SportShoeIcon: () => import_sport_shoe.SportShoeIcon,
  SwordsIcon: () => import_swords.SwordsIcon,
  TargetIcon: () => import_target.TargetIcon,
  TrophyIcon: () => import_trophy.TrophyIcon
});
module.exports = __toCommonJS(sports_exports);
var import_ball_american_football = require("./ball-american-football.cjs");
var import_ball_american_football_off = require("./ball-american-football-off.cjs");
var import_ball_baseball = require("./ball-baseball.cjs");
var import_ball_basketball = require("./ball-basketball.cjs");
var import_ball_bowling = require("./ball-bowling.cjs");
var import_ball_football = require("./ball-football.cjs");
var import_ball_football_off = require("./ball-football-off.cjs");
var import_ball_tennis = require("./ball-tennis.cjs");
var import_ball_volleyball = require("./ball-volleyball.cjs");
var import_dumbbell = require("./dumbbell.cjs");
var import_goal = require("./goal.cjs");
var import_medal = require("./medal.cjs");
var import_sport_shoe = require("./sport-shoe.cjs");
var import_swords = require("./swords.cjs");
var import_target = require("./target.cjs");
var import_trophy = require("./trophy.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BallAmericanFootballIcon,
  BallAmericanFootballOffIcon,
  BallBaseballIcon,
  BallBasketballIcon,
  BallBowlingIcon,
  BallFootballIcon,
  BallFootballOffIcon,
  BallTennisIcon,
  BallVolleyballIcon,
  DumbbellIcon,
  GoalIcon,
  MedalIcon,
  SportShoeIcon,
  SwordsIcon,
  TargetIcon,
  TrophyIcon
});
