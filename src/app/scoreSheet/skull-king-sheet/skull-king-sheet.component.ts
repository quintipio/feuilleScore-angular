import { Component, inject, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Table } from '../../models/table.model';
import { TableService } from '../../service/table.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WinnerComponent } from '../../components/winner/winner.component';
import { User } from '../../models/user.model';
import { InputScoreComponent } from '../../components/input-score/input-score.component';
import { CountRoundRow, RoundRow } from '../../models/sheet';



type skullKingPlayer = {
  user: User,
  pari: number,
  pliGagne: number,
  scoreTotal: number,
  scoreManche: number,
  bonusAutre: number,
  bonusButin: number,
  bonusSkullKing: number,
  bonusSirene: number,
  bonusPirate: number,
  bonusDix: number
}

type SkullKingRound = {
  manche: number;
  players: skullKingPlayer[]
}

@Component({
  selector: 'app-skull-king-sheet',
  standalone: true,
  imports: [CommonModule, InputScoreComponent],
  templateUrl: './skull-king-sheet.component.html',
  styleUrl: './skull-king-sheet.component.css'
})
export class SkullKingSheetComponent {
  @ViewChild(WinnerComponent) winnerComponent: WinnerComponent | undefined;
  @ViewChildren(InputScoreComponent) inputScores: QueryList<InputScoreComponent> | undefined;

  private tableService = inject(TableService);

  table: Table | undefined;

  mancheEnCours: SkullKingRound | undefined;
  histoManche: { [id: string]: SkullKingRound } = {};
  numbers: number[] = [];

  constructor(private route: ActivatedRoute, private router: Router) { }


  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const idTable = +params['idTable'];
      if (idTable) {
        this.tableService.getTable(idTable).subscribe({
          next: (table: Table | undefined) => {
            if (table) {
              this.table = table;
              this.loadManche();
            }
          },
          error: (error) => {
            console.error("Error fetching table:", error);
          }
        });
      }
    });
  }

  private loadManche() {
    if(this.table?.specificData !== undefined && this.table.specificData !== ""){
      this.histoManche = JSON.parse(this.table.specificData);
      console.log(this.histoManche);
      const maxId = Object.keys(this.histoManche).map(key => parseInt(key)).reduce((max, current) => (current > max ? current : max), -Infinity);
      this.newRound(this.histoManche[maxId.toString()]);
    } else {
      this.newRound(undefined);
    }
  }

  private newRound(oldManche: SkullKingRound | undefined) {
    const newManche: SkullKingRound = {
      "manche": (oldManche === undefined)?1 : oldManche.manche + 1,
      "players": [],
    }
    if(oldManche){
      oldManche.players.forEach((player) => {
        const playerBis: skullKingPlayer = {
          user: player.user,
          pari: 0,
          pliGagne: 0,
          scoreTotal: player.scoreTotal + player.scoreManche,
          scoreManche: 0,
          bonusAutre: 0,
          bonusButin: 0,
          bonusSkullKing: 0,
          bonusSirene: 0,
          bonusPirate: 0,
          bonusDix: 0
        }
        newManche.players.push(playerBis)
      });
    } else {
      this.table!.users.forEach((userRow) => {
        const player: skullKingPlayer = {
          user: userRow,
          pari: 0,
          pliGagne: 0,
          scoreTotal: 0,
          scoreManche: 0,
          bonusAutre: 0,
          bonusButin: 0,
          bonusSkullKing: 0,
          bonusSirene: 0,
          bonusPirate: 0,
          bonusDix: 0
        }
        newManche.players.push(player);
      })
    }
    this.mancheEnCours = newManche;
    this.numbers = this.numbers = Array.from({ length: this.mancheEnCours.manche + 1 }, (_, i) => i)
    console.log(this.numbers);

  }

  isSelectedPari(player: skullKingPlayer, num: number) {
    return player.pari === num;
  }

  changePari(player: skullKingPlayer, num: number) {
    player.pari = num;
    this.calculerScoreManche(player);
  }

  isSelectedScore(player: skullKingPlayer, num: number) {
    return player.pliGagne === num;
  }

  changeScore(player: skullKingPlayer, num: number) {
    player.pliGagne = num;
    this.calculerScoreManche(player);
  }

  getBonusAutre(player: skullKingPlayer, value: number) {
    player.bonusAutre = value;
    this.calculerScoreManche(player);
  }

  getBonusButin(player: skullKingPlayer, value: number) {
    player.bonusButin = value;
    this.calculerScoreManche(player);
  }

  getBonusSkullKing(player: skullKingPlayer, value: number) {
    player.bonusSkullKing = value;
    this.calculerScoreManche(player);
  }

  getBonusSirene(player: skullKingPlayer, value: number) {
    player.bonusSirene = value;
    this.calculerScoreManche(player);
  }

  getBonusPirate(player: skullKingPlayer, value: number) {
    player.bonusPirate = value;
    this.calculerScoreManche(player);
  }

  getBonusDix(player: skullKingPlayer, value: number) {
    player.bonusDix = value;
    this.calculerScoreManche(player);
  }

  private calculerScoreManche(player: skullKingPlayer) {
    var newScore = 0;
    if (player.pari > 0) {
      const dif = Math.abs(player.pari - player.pliGagne);
      if (dif === 0) {
        newScore = player.pliGagne * 20;
        newScore += player.bonusAutre;
        newScore += player.bonusButin * 20;
        newScore += player.bonusSkullKing * 40;
        newScore += player.bonusPirate * 20;
        newScore += player.bonusSirene * 30;
        newScore += player.bonusDix * 10;
      } else {
        newScore += dif * -10;
      }
    } else {
      if(player.pari == player.pliGagne){
        newScore += this.mancheEnCours?.manche! * 10;
      } else {
        newScore += this.mancheEnCours?.manche! * -10;
      }
    }
    player.scoreManche = newScore;
  }

  mancheSuivante(){
    this.saveManche();
    this.newRound(this.mancheEnCours);
    this.inputScores?.forEach(inputScore => {
      inputScore.reinit(0);
    });
  }

  manchePrecedente(){
    this.saveManche();
    this.openManche(this.mancheEnCours!.manche-1);
  }

  openManche(mancheToOpen : number){
    this.mancheEnCours = this.histoManche[mancheToOpen.toString()];
    this.numbers = this.numbers = Array.from({ length: this.mancheEnCours.manche +1 }, (_, i) => i);
    console.log(this.mancheEnCours);
  }

  private saveManche(){
    this.histoManche[this.mancheEnCours!.manche.toString()] = this.mancheEnCours!;
    this.table!.round = this.genererHistoRound();

    this.table!.specificData = JSON.stringify(this.histoManche);
    this.tableService.updateTable(this.table!).subscribe({
      next: () => {
      },
      error: (error) => {
        console.error("Error update table:", error);
      }
    });
  }



  private genererHistoRound() : RoundRow[]{
    var round : RoundRow[] = [];
    for (const id in this.histoManche) {
      if (this.histoManche.hasOwnProperty(id)) {
        const data = this.histoManche[id];
        const roundRow: RoundRow = {
          "row" : data.manche,
          "points" : this.convertPlayerToCountRoundRow(data.players)
        }
        round.push(roundRow);
      }
    }
    return round;
  }

  private convertPlayerToCountRoundRow(players: skullKingPlayer[]) : CountRoundRow[]{
    const retour : CountRoundRow[] = [];
    players.forEach((player)  => {
      const countRoundRow: CountRoundRow = {
        "value" : player.scoreManche,
        "user" : {
          position : 1,
          user : player.user
        }
      }
      retour.push(countRoundRow);
    });
    return retour;
  }
}
