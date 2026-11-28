<?php

namespace Tests\Unit\Helpers;

use App\Helpers\SortTitle;
use App\Models\Song;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SortTitleTest extends TestCase
{
    /** @return array<string, array{string, string}> */
    public static function provideTitles(): array
    {
        return [
            'The' => ['The Song', 'Song, The'],
            'A' => ['A Song', 'Song, A'],
            'An' => ['An Ocean', 'Ocean, An'],
            'Spanish' => ['Los Lobos', 'Lobos, Los'],
            'French' => ['Les Misérables', 'Misérables, Les'],
            'lowercase article' => ['the clock ticks on', 'Clock ticks on, the'],
            'no article' => ['Theory of Everything', 'Theory of Everything'],
            'article without a space after it' => ['A-ha', 'A-ha'],
            'article alone' => ['The', 'The'],
            'surrounding spaces' => ['  The Song  ', 'Song, The'],
            'invisible characters' => ["\u{2060}The Puppet\u{200B} King", 'Puppet King, The'],
        ];
    }

    #[Test]
    #[DataProvider('provideTitles')]
    public function moveTheLeadingArticleToTheEnd(string $title, string $sortTitle): void
    {
        self::assertSame($sortTitle, SortTitle::fromTitle($title));
    }

    #[Test]
    public function limitTheLength(): void
    {
        self::assertSame(SortTitle::MAX_LENGTH, mb_strlen(SortTitle::fromTitle(str_repeat('ê', 300))));
    }

    #[Test]
    public function sortsAnOceanAsOceanAnWhenSaved(): void
    {
        $song = Song::factory()->createOne(['title' => 'An Ocean']);

        self::assertSame('Ocean, An', $song->refresh()->title_sort);
    }

    #[Test]
    public function keepsTheSongSortTitleAsSongTheWhenSaved(): void
    {
        $song = Song::factory()->createOne(['title' => 'The Song']);

        self::assertSame('Song, The', $song->refresh()->title_sort);
    }

    #[Test]
    public function keepsASongSortTitleAsSongAWhenSaved(): void
    {
        $song = Song::factory()->createOne(['title' => 'A Song']);

        self::assertSame('Song, A', $song->refresh()->title_sort);
    }
}
