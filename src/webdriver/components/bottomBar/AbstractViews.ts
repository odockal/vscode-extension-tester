import { AbstractElement } from "../AbstractElement";
import { By, until, Key } from 'selenium-webdriver';
import * as clipboard from 'clipboardy';

/**
 * View with channel selector
 */
export abstract class ChannelView extends AbstractElement {
    protected actionsLabel!: string;

    /**
    * Get names of all selectable channels
    * @returns array of strings - channel names
    */
   async getChannelNames(): Promise<string[]> {
       const names: string[] = [];
       const elements = await this.enclosingItem.findElement(By.xpath(`.//ul[@aria-label='${this.actionsLabel}']`))
           .findElements(By.tagName('option'));
       
       for (const element of elements) {
           const disabled = await element.getAttribute('disabled');
           if (!disabled) {
               names.push(await element.getAttribute('value'));
           }
       }
       return names;
   }

   /**
    * Select a channel using the selector combo
    * @param name name of the channel to open
    */
   async selectChannel(name: string): Promise<void> {
       const combo = await this.enclosingItem.findElement(By.tagName('select'));
       const workbench = await this.getDriver().findElement(By.className('monaco-workbench'));
       const menu = await workbench.findElement(By.className('context-view'));

       if (await menu.isDisplayed()) {
           await combo.click();
           await this.getDriver().wait(until.elementIsNotVisible(menu));
       }
       await combo.click();
       const rows = await menu.findElements(By.className('monaco-list-row'));
       for (let i = 0; i < rows.length; i++) {
           if ((await rows[i].getAttribute('class')).indexOf('disabled') < 0) {
               const text = await rows[i].findElement(By.className('option-text')).getText();
               if (name === text) {
                   return await rows[i].click();
               }
           }
       }
   }
}

/**
 * View with channel selection and text area
 */
export abstract class TextView extends ChannelView {
    protected actionsLabel!: string;

    /**
     * Get all text from the currently open channel
     */
    async getText(): Promise<string> {
        const textarea = await this.findElement(By.tagName('textarea'));
        await textarea.sendKeys(Key.chord(TextView.ctlKey, 'a'));
        await textarea.sendKeys(Key.chord(TextView.ctlKey, 'c'));
        const text = clipboard.readSync();
        await textarea.click();
        return text;
    }

    /**
     * Clear the text in the current channel
     */
    async clearText(): Promise<void> {
        await this.enclosingItem.findElement(By.xpath(`.//ul[@aria-label='${this.actionsLabel}']`))
            .findElement(By.className('clear-output')).click();
    }
}
