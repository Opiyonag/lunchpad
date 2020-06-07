import React from 'react';
import { Output } from 'webmidi'

import * as _ from 'lodash'


import { LaunchpadButton } from '@lunchpad/base'
import { IconChevronRight, IconCaretUpSolid, IconCaretDownSolid, IconCaretLeftSolid, IconCaretRightSolid, IconCircle } from '@lunchpad/icons';

import { Page, ControllerType } from '@lunchpad/types'

import { PadContainer } from '../components';
import { XYToButton, ButtonToXY, MakeButtonColor } from './helper'
import { IPadProps } from '..';

const EmptyButton = (x, y) => ({
  title: "",
  x,
  y,
  color: {r: 0, g: 0, b: 0}
})

const UpRow = [
  <IconCaretUpSolid />,
  <IconCaretDownSolid />,
  <IconCaretLeftSolid />,
  <IconCaretRightSolid />,
  <span>Session<br />Mixer</span>,
  <span>Note</span>,
  <span>Custom</span>,
  <span style={{ fontSize: "1rem"}}><IconCircle /><br />Capture MIDI</span>,
]

const RightRow = [
  <span style={{ fontSize: "1rem"}}><IconChevronRight /><br />Volume</span>,
  <span style={{ fontSize: "1rem"}}><IconChevronRight /><br />Pan</span>,
  <span style={{ fontSize: "1rem"}}><IconChevronRight /><br />Send A</span>,
  <span style={{ fontSize: "1rem"}}><IconChevronRight /><br />Send B</span>,
  <span style={{ fontSize: "1rem"}}><IconChevronRight /><br />Stop Clip</span>,
  <span style={{ fontSize: "1rem"}}><IconChevronRight /><br />Mute</span>,
  <span style={{ fontSize: "1rem"}}><IconChevronRight /><br />Solo</span>,
  <span style={{ fontSize: "1rem"}}><IconChevronRight /><br />Record Arm</span>,
]

const Vendor = [0x0, 0x20, 0x29];
const Mode = [0x2, 0xD, 0x0, 0x7F];
const Color = [0x2, 0xD, 0x3];

const Component: React.SFC<IPadProps> = ({ onDrop, onButtonPressed, onContextMenu, onSettingsButtonClick, activePage }) => {
  
  return (
    <PadContainer width={9} height={9}>
      {_.reverse(_.range(0, 9)).map((y) => _.range(0,9).map((x) => {
        const button  = _.get(activePage?.buttons ?? {}, `[${x}][${y}]`, EmptyButton(x,y)) // as Button;
        const color = MakeButtonColor(button.color)
        
        return XYToButton(x,y) !== 99 ? (
          <LaunchpadButton
            x={x}
            y={y}
            color={color}
            keyId={XYToButton(x,y)}
            
            clip={x === 8 || y === 8}
            key={`${x}${y}`}
            onContextMenu={onContextMenu}
            onClick={(e) => {
              onButtonPressed(e, x, y, XYToButton(x,y), false);
            }}
            onDrop={onDrop}
          >
            {x === 8 || y === 8 ? x === 8 ? RightRow[7 - y] : UpRow[x] : button.title}
          </LaunchpadButton>
        ) : (
          <LaunchpadButton
            x={8}
            y={8}
            key="settings"
            keyId={112}
            color={"#6a45ff"}
            round
            onContextMenu={() => true}
            onClick={onSettingsButtonClick}
            onDrop={() => {}}
          >
            SET
          </LaunchpadButton>
        )
      }
      ))}
    </PadContainer>
  )
}

const buildColors = (output: Output, page: Page) => {
  if (!output) return;
  // Switch to programmers mode
  output.sendSysex(Vendor, Mode);

  // Clear Pad
  const clear = _.flatten(_.range(11, 11+89).map(i => (i === 99 ? [2, 99, 45] : [0, i, 0])))
  output.sendSysex(Vendor, [...Color, ...clear])
  
  // Build color array
  const colors = _.flattenDeep(Object.keys(page.buttons).map(x => {
    return Object.keys(page.buttons[x]).map(y => {
      const { r, g, b } = page.buttons[parseInt(x)][parseInt(y)].color;
      // conversion from full rgb to X rgb = / 2 | max 127
      return [3, XYToButton(parseInt(x),parseInt(y)), Math.floor(r / 2), Math.floor(g / 2), Math.floor(b / 2)]
    })
  }))

  // Set colors
  output.sendSysex(Vendor, [...Color, ...colors]);
}

export const LaunchpadX = {
  name: "Launchpad X",
  type: ControllerType.Launchpad,
  buildColors,
  XYToButton,
  ButtonToXY,
  Component,
  limitedColor: false
}