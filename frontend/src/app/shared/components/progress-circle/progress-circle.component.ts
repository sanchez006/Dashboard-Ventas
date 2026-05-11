import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-circle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-container">
      <!-- Circular Progress -->
      <div class="circle-wrapper">
        <svg class="progress-svg" viewBox="0 0 120 120">
          <!-- Background circle -->
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            stroke-width="8"
          />
          <!-- Progress circle -->
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            [attr.stroke]="getColor()"
            stroke-width="8"
            stroke-linecap="round"
            [attr.stroke-dasharray]="getStrokeDasharray()"
            stroke-dashoffset="0"
            style="stroke-dashoffset: 0; transition: stroke-dasharray 1000ms ease-out;"
          />
        </svg>

        <!-- Center content -->
        <div class="center-content">
          <div class="percentage-text">{{ percentage }}%</div>
          <div class="meta-text">META</div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .progress-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
      }

      .circle-wrapper {
        position: relative;
        width: 200px;
        height: 200px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .progress-svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
        position: absolute;
        top: 0;
        left: 0;
      }

      .center-content {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10;
      }

      .percentage-text {
        font-size: 56px;
        font-weight: 900;
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1;
        margin-bottom: 4px;
        letter-spacing: -2px;
      }

      .meta-text {
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
    `,
  ],
})
export class ProgressCircleComponent implements OnInit, OnChanges {
  @Input() currentAmount: number = 0;
  @Input() targetAmount: number = 4000;

  percentage: number = 0;

  ngOnInit() {
    this.calculatePercentage();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentAmount'] || changes['targetAmount']) {
      this.calculatePercentage();
    }
  }

  private calculatePercentage() {
    this.percentage = Math.min(
      Math.round((this.currentAmount / this.targetAmount) * 100),
      100
    );
  }

  get remaining(): number {
    return Math.max(this.targetAmount - this.currentAmount, 0);
  }

  getColor(): string {
    if (this.percentage >= 100) return '#4ade80'; // green
    if (this.percentage >= 75) return '#3b82f6'; // blue
    if (this.percentage >= 50) return '#a78bfa'; // purple
    if (this.percentage >= 25) return '#f87171'; // red
    return '#ff6b6b'; // red
  }

  getStrokeDasharray(): string {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference * ((100 - this.percentage) / 100);
    return `${circumference - offset} ${circumference}`;
  }
}
